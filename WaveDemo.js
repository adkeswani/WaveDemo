var waveProgram;
var waveFragmentShaderScript = `#version 300 es

    precision highp float;

    in vec3 v_normal;
    in vec3 v_position;

    uniform float u_time;
    uniform vec3 u_reverseLightDirection;
    uniform vec4 u_color;

    out vec4 out_color;

    void main(void) 
    {
      // because v_normal is a varying it's interpolated
      // so it will not be a uint vector. Normalizing it
      // will make it a unit vector again
      vec3 normal = normalize(v_normal);

      // compute the light by taking the dot product
      // of the normal to the light's reverse direction
      float light = dot(normal, u_reverseLightDirection);

      out_color = u_color;
      //out_color.rgb *= abs(normal.x);
      //out_color.rgb *= abs(sin(v_position.y / 20.0 + u_time / 1000.0));

      // Lets multiply just the color portion (not the alpha)
      // by the light
      out_color.rgb *= light;
    }
`;

var waveVertexShaderScript = `#version 300 es

    in vec3 a_position; 
    in vec3 a_normal; // Unused, only here for sample code for multiple buffers

    uniform mat4 u_projectionMatrix;
    uniform mat4 u_modelViewMatrix;
    uniform float u_time;

    out vec3 v_normal;
    out vec3 v_position;

    void main(void) 
    {
        vec3 newPosition = a_position;
        newPosition.z += 50.0 * sin(newPosition.x / 20.0 + u_time / 1000.0);
        gl_Position = u_projectionMatrix * u_modelViewMatrix * vec4(newPosition, 1.0);

        vec3 newNormal = a_normal; // Unused, only here for sample code for multiple buffers, to prevent out of range warning
        newNormal = normalize(vec3(cos(newPosition.x / 20.0 + u_time / 1000.0), 0, 1));
        v_normal = (u_modelViewMatrix * vec4(newNormal, 1.0)).xyz;
        v_position = newPosition;
    }
`;

var waveVertexArrayObject;
var projectionMatrix;
var modelViewMatrix;
var reverseLightDirection;
var color;
var numVertices = 0;

function getLocations(program)
{
    program.a_position = gl.getAttribLocation(program, "a_position");
    program.a_normal = gl.getAttribLocation(program, "a_normal");
    program.u_projectionMatrix = gl.getUniformLocation(program, "u_projectionMatrix");
    program.u_modelViewMatrix = gl.getUniformLocation(program, "u_modelViewMatrix");
    program.u_color = gl.getUniformLocation(program, "u_color");
    program.u_reverseLightDirection = gl.getUniformLocation(program, "u_reverseLightDirection");
    program.u_time = gl.getUniformLocation(program, "u_time");
}

function sendNewUniforms()
{
    gl.uniformMatrix4fv(program.u_projectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(program.u_modelViewMatrix, false, modelViewMatrix);
    gl.uniform3fv(program.u_reverseLightDirection, reverseLightDirection);
    gl.uniform4fv(program.u_color, color);
    gl.uniform1f(program.u_time, lastTime);
}

function initUniforms()
{
    projectionMatrix = glMatrix.mat4.create();
    glMatrix.mat4.ortho(projectionMatrix, -gl.viewportWidth / 2, gl.viewportWidth / 2, -gl.viewportHeight / 2, gl.viewportHeight / 2, -1000, 1000);

    modelViewMatrix = glMatrix.mat4.create();
    glMatrix.mat4.identity(modelViewMatrix);

    reverseLightDirection = glMatrix.vec3.fromValues(1, 1, 1);
    glMatrix.vec3.normalize(reverseLightDirection, reverseLightDirection);

    color = glMatrix.vec4.fromValues(0, 1, 0, 1);
}

function initBuffers()
{
    numVertices = 0;
    var vertices = [];
    var normals = [];
    for (var i = 0; i < 20; i++)
    {
        vertices.push(-200.0+ (i * 20.0), -50.0, 0.0); 
        vertices.push(-200.0+ (i * 20.0), 50.0, 0.0); 
        vertices.push(-200.0+ ((i + 1) * 20.0), 50.0, 0.0); 

        vertices.push(-200.0+ (i * 20.0), -50.0, 0.0); 
        vertices.push(-200.0+ ((i + 1) * 20.0), 50.0, 0.0); 
        vertices.push(-200.0+ ((i + 1) * 20.0), -50.0, 0.0); 

        normals.push(0.0, 0.0, 1.0);
        normals.push(0.0, 0.0, 1.0);
        normals.push(0.0, 0.0, 1.0);
        normals.push(0.0, 0.0, 1.0);
        normals.push(0.0, 0.0, 1.0);
        normals.push(0.0, 0.0, 1.0);

        numVertices += 6;
    }

    var vertexBuffer = gl.createBuffer();
    waveVertexArrayObject = gl.createVertexArray();
    gl.bindVertexArray(waveVertexArrayObject);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.enableVertexAttribArray(program.a_position);
    var size = 3;
    var type = gl.FLOAT;
    var normalize = false;
    var stride = 0;
    var offset = 0;
    gl.vertexAttribPointer(program.a_position, size, type, normalize, stride, offset);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    var normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.enableVertexAttribArray(program.a_normal);
    var size = 3;
    var type = gl.FLOAT;
    var normalize = false;
    var stride = 0;
    var offset = 0;
    gl.vertexAttribPointer(program.a_normal, size, type, normalize, stride, offset);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
}

function drawScene() 
{
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(waveProgram);

    sendNewUniforms();

    var offset = 0;
    gl.drawArrays(gl.TRIANGLES, offset, numVertices);
}

function rotateSquares(key)
{
    switch (key.code)
    {
        case 'KeyQ':
            glMatrix.mat4.rotateX(projectionMatrix, projectionMatrix, 0.1);
            break;
        case 'KeyW':
            glMatrix.mat4.rotateX(projectionMatrix, projectionMatrix, -0.1);
            break;
        case 'KeyA':
            glMatrix.mat4.rotateY(projectionMatrix, projectionMatrix, 0.1);
            break;
        case 'KeyS':
            glMatrix.mat4.rotateY(projectionMatrix, projectionMatrix, -0.1);
            break;
        case 'KeyZ':
            glMatrix.mat4.rotateZ(projectionMatrix, projectionMatrix, 0.1);
            break;
        case 'KeyX':
            glMatrix.mat4.rotateZ(projectionMatrix, projectionMatrix, -0.1);
            break;
    }
}

var lastTime = 0;
function tick(now)
{
    drawScene();
    if (lastTime != 0) 
    {
        var elapsed = now - lastTime;
    }

    lastTime = now;
    requestAnimationFrame(tick);
}

function demoStart() 
{
    var canvas = document.getElementById("demo");
    initGl(canvas);

    initUniforms();

    waveProgram = createProgram(waveFragmentShaderScript, waveVertexShaderScript);
    getLocations(waveProgram);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    initBuffers();

    document.addEventListener('keypress', rotateSquares);
    tick();
}
