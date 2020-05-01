// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require("three");

// Include any additional ThreeJS examples below
require("three/examples/js/controls/OrbitControls");

const canvasSketch = require("canvas-sketch");
const glsl = require("glslify");
const settings = {
  // Make the loop animated
  animate: true,
  // Get a WebGL canvas rather than 2D
  context: "webgl",
};

const sketch = ({ context }) => {
  // Create a renderer
  const renderer = new THREE.WebGLRenderer({
    canvas: context.canvas,
  });

  // WebGL background color
  renderer.setClearColor("white", 1);

  // Setup a camera
  const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 100);
  camera.position.set(3, 3, -5);
  camera.lookAt(new THREE.Vector3());

  // Setup camera controller
  const controls = new THREE.OrbitControls(camera, context.canvas);

  // Setup your scene
  const scene = new THREE.Scene();

  // A grid
  const gridScale = 10;
  scene.add(
    new THREE.GridHelper(gridScale, 10, "hsl(0, 0%, 50%)", "hsl(0, 0%, 70%)")
  );
  scene.add(new THREE.AxesHelper(5));

  // A custom geometry
  // prettier-ignore
  const vertices = [
    -1, -1, 0,
    0, 1, 0,
    -1, 1, 0,

    -1, -1, 0,
    0, -1, 0,
    0, 1, 0,

    0, -1, 0,
    1, 1, 0,
    0, 1, 0,

    0, -1, 0,
    1, -1, 0,
    1, 1, 0,
]
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(vertices), 3)
  );

  const coordinates = [
    [0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1],
    [0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1],
  ];

  const uvs = coordinates.flat();

  geometry.setAttribute(
    "uv",
    new THREE.BufferAttribute(new Float32Array(uvs), 2)
  );

  geometry.addGroup(0, coordinates[0].length / 2, 0);
  geometry.addGroup(coordinates[0].length / 2, coordinates[1].length / 2, 1);

  const textures = ["brick-normal.jpg", "brick-diffuse.jpg"];

  const vertexShader = /* glsl */ `
    varying vec2 vUv;
    varying vec3 vPosition;
    void main(){
      vPosition = position;
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xyz, 1.0);
    }
  `;

  const fragmentShader = glsl(/* glsl */ `
 
    varying vec2 vUv;
    varying vec3 vPosition;
    uniform sampler2D texture1;
    uniform vec3 color;
    
    void main(){
      gl_FragColor = texture2D(texture1, vUv);
    }
  `);

  const material = textures.map((t) => {
    const texture = new THREE.TextureLoader().load(t);
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        texture1: { type: "t", value: texture },
      },
      extensions: {
        derivatives: true,
      },
      fragmentShader,
      vertexShader,
      side: THREE.DoubleSide,
    });
  });

  // Create a mesh
  const mesh = new THREE.Mesh(geometry, material);
  console.log(material);

  // Add it to the scene
  scene.add(mesh);

  // draw each frame
  return {
    // Handle resize events here
    resize({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewportWidth, viewportHeight, false);
      camera.aspect = viewportWidth / viewportHeight;
      camera.updateProjectionMatrix();
    },
    // Update & render your scene here
    render({ time }) {
      mesh.rotation.y = time * 0.15;
      controls.update();
      renderer.render(scene, camera);
    },
    // Dispose of events & renderer for cleaner hot-reloading
    unload() {
      controls.dispose();
      renderer.dispose();
    },
  };
};

canvasSketch(sketch, settings);
