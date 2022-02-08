const sliderX = document.getElementById("slider-x");
const sliderY = document.getElementById("slider-y");

const sliderScaleX = document.getElementById("x-scaler");
const sliderScaleY = document.getElementById("y-scaler");

console.log(sliderScaleX)

sliderX.value = 650;
sliderY.value = 125;


function main() {
    // Get A WebGL context
    /** @type {HTMLCanvasElement} */
    var canvas = document.querySelector("#canvas");

    // Get WebGL Context
    /** @type {WebGLRenderingContext} */
    const gl = canvas.getContext("webgl");
    if (!gl) {
        return;
    }

    // Create the shaders
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    // Absorb the GLSL into the shader
    gl.shaderSource(vertexShader, vertexShaderText);
    gl.shaderSource(fragmentShader, fragmentShaderText);

    // Compile the shader
    gl.compileShader(vertexShader);
    gl.compileShader(fragmentShader);

    // Check any error in the GLSL syntaxes
    if (
        !gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS) ||
        !gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)
    ) {
        console.log("Error Compiling Shader");
        return;
    }

    // Create a program and attach the shader
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    // Link the program and check if there is any error
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log("Error Linking Program");
        return;
    }

    gl.useProgram(program);

    // look up where the vertex data needs to go.
    var positionLocation = gl.getAttribLocation(program, "a_position");

    // lookup uniforms
    var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    var colorLocation = gl.getUniformLocation(program, "u_color");
    var translationLocation = gl.getUniformLocation(program, "u_translation");
    var rotationLocation = gl.getUniformLocation(program, "u_rotation");
    var scaleLocation = gl.getUniformLocation(program, "u_scale");

    // Create a buffer to put positions in
    var positionBuffer = gl.createBuffer();
    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // Put geometry data into buffer
    setGeometry(gl);

    var scale = [1, 1];
    let rotation = [0, 1];
    var translation = [650, 125];
    var color = [Math.random(), Math.random(), Math.random(), 1];

    drawScene();

    // Setup a ui.
    sliderX.max = canvas.width;
    sliderY.max = canvas.height;
    setupScaler(sliderScaleX);
    setupScaler(sliderScaleY);
    // angleSlider.max = 360;

    sliderX.addEventListener("input", handleChangeX);
    sliderX.addEventListener("change", handleChangeX);
    sliderY.addEventListener("input", handleChangeY);
    sliderY.addEventListener("change", handleChangeY);
    sliderScaleX.addEventListener("input", handleScaleX);
    sliderScaleX.addEventListener("change", handleScaleX);
    sliderScaleY.addEventListener("input", handleScaleY);
    sliderScaleY.addEventListener("change", handleScaleY);
    // angleSlider.addEventListener("input", updateAngle);
    // angleSlider.addEventListener("change", updateAngle);

    $("#rotation").gmanUnitCircle({
        width: 200,
        height: 200,
        value: 0,
        slide: function (e, u) {
            rotation[0] = u.x;
            rotation[1] = u.y;
            drawScene();
        },
    });

    function setupScaler(scaler) {
        scaler.max = 5;
        scaler.min = -5;
        scaler.step = 0.01;
        scaler.precision = 2;
    }

    function updatePosition(index, ui) {
        translation[index] = ui.value;
        drawScene();
    }

    function handleChangeX(event) {
        const value = event.target.value;
        updatePosition(0, { value: value });
    }

    function handleChangeY(event) {
        const value = event.target.value;
        updatePosition(1, { value: value });
    }

    function handleScaleX(event) {
        const value = event.target.value;
        updateScale(0, { value: value });
    }

    function handleScaleY(event) {
        const value = event.target.value;
        updateScale(1, { value: value });
    }

    function updateAngle(event) {
        var angleInDegrees = 360 - event.target.value;
        var angleInRadians = (angleInDegrees * Math.PI) / 180;
        rotation[0] = Math.sin(angleInRadians);
        rotation[1] = Math.cos(angleInRadians);
        drawScene();
    }

    function updateScale(index, ui) {
        scale[index] = ui.value;
        drawScene();
    }

    function resizeCanvas(canvas, multiplier) {
        multiplier = multiplier || 1;
        const width = (canvas.clientWidth * multiplier) | 0;
        const height = (canvas.clientHeight * multiplier) | 0;
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
            return true;
        }
        return false;
    }

    // Draw the scene.
    function drawScene() {
        // Resize canvas to display size
        resizeCanvas(gl.canvas);

        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        // Clear the canvas.
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Tell it to use our program (pair of shaders)
        gl.useProgram(program);

        // Turn on the attribute
        gl.enableVertexAttribArray(positionLocation);

        // Bind the position buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        var size = 2; // 2 components per iteration
        var type = gl.FLOAT; // the data is 32bit floats
        var normalize = false; // don't normalize the data
        var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
        var offset = 0; // start at the beginning of the buffer
        gl.vertexAttribPointer(positionLocation, size, type, normalize, stride, offset);

        // set the resolution
        gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

        // set the color
        gl.uniform4fv(colorLocation, color);

        // Set the translation.
        gl.uniform2fv(translationLocation, translation);

        // Set the rotation.
        gl.uniform2fv(rotationLocation, rotation);

        // Set the scale.
        gl.uniform2fv(scaleLocation, scale);

        // Draw the geometry.
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 18; // 6 triangles in the 'F', 3 points per triangle
        gl.drawArrays(primitiveType, offset, count);
    }
}

// Fill the buffer with the values that define a letter 'F'.
function setGeometry(gl) {
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            // left column
            0, 0, 30, 0, 0, 150, 0, 150, 30, 0, 30, 150,

            // top rung
            30, 0, 100, 0, 30, 30, 30, 30, 100, 0, 100, 30,

            // middle rung
            30, 60, 67, 60, 30, 90, 30, 90, 67, 60, 67, 90,
        ]),
        gl.STATIC_DRAW
    );
}

const vertexShaderText = [
    `attribute vec2 a_position;

    uniform vec2 u_resolution;
    uniform vec2 u_translation;
    uniform vec2 u_rotation;
    uniform vec2 u_scale;
 
    void main() {
    // Scale the position
    vec2 scaledPosition = a_position * u_scale;
    
    // Rotate the position
    vec2 rotatedPosition = vec2(
        scaledPosition.x * u_rotation.y + scaledPosition.y * u_rotation.x,
        scaledPosition.y * u_rotation.y - scaledPosition.x * u_rotation.x);
    
      // Add in the translation.
      vec2 position = rotatedPosition + u_translation;
    
      // convert the position from pixels to 0.0 to 1.0
      vec2 zeroToOne = position / u_resolution;
    
      // convert from 0->1 to 0->2
      vec2 zeroToTwo = zeroToOne * 2.0;
    
      // convert from 0->2 to -1->+1 (clipspace)
      vec2 clipSpace = zeroToTwo - 1.0;
    
      gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    }`,
];

const fragmentShaderText = [
    `precision mediump float;

    uniform vec4 u_color;
    
    void main() {
       gl_FragColor = u_color;
    }`,
];

main();