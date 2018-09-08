var camera, scene, renderer, geometry, material, mesh, controls, raycaster;

var keys = [],
  objects = [],
  collidableMeshList = [];

var controlsEnabled = false,
  canJump = false;

var velocity = new THREE.Vector3(),
  mouse = new THREE.Vector2(),
  raycaster2 = new THREE.Raycaster(),
  loader = new THREE.TextureLoader();

var prevTime = performance.now(),
  MovingCube,
  PlayerModel;

var stats = new Stats();

const BLOCK_SIZE = 10,
  worldWidth = 30,
  worldHeight = 30

const grassMaterial = [
  new THREE.MeshBasicMaterial({ map: loader.load('textures/grass_side.png') }),
  new THREE.MeshBasicMaterial({ map: loader.load('textures/grass_side.png') }),
  new THREE.MeshBasicMaterial({ map: loader.load('textures/grass_top.png') }),
  new THREE.MeshBasicMaterial({ map: loader.load('textures/dirt.png') }),
  new THREE.MeshBasicMaterial({ map: loader.load('textures/grass_side.png') }),
  new THREE.MeshBasicMaterial({ map: loader.load('textures/grass_side.png') })
];

const woodMaterial = [
  new THREE.MeshBasicMaterial({ map: loader.load('textures/log_oak.png') }),
  new THREE.MeshBasicMaterial({ map: loader.load('textures/log_oak.png') }),
  new THREE.MeshBasicMaterial({ map: loader.load('textures/log_oak_top.png') }),
  new THREE.MeshBasicMaterial({ map: loader.load('textures/log_oak_top.png') }),
  new THREE.MeshBasicMaterial({ map: loader.load('textures/log_oak.png') }),
  new THREE.MeshBasicMaterial({ map: loader.load('textures/log_oak.png') })
];

const materials = [
  new THREE.MeshBasicMaterial({ map: loader.load("textures/dirt.png") }),
  new THREE.MeshBasicMaterial({ map: loader.load("textures/cobblestone.png") }),
  new THREE.MeshBasicMaterial({ map: loader.load("textures/brick.png") }),
  new THREE.MeshBasicMaterial({ map: loader.load("textures/stone.png") }),
  new THREE.MeshBasicMaterial({ map: loader.load("textures/wool.png") }),
  new THREE.MeshBasicMaterial({ map: loader.load("textures/sand.png") }),
  new THREE.MeshBasicMaterial({ map: loader.load("textures/stonebrick.png") }),
  grassMaterial,
  woodMaterial
]

var currentMaterial = materials[0];
var currentMaterialIndex = 0;

init();
animate();

function init() {

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1500);
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  scene.add(new THREE.AmbientLight(0xffffff))

  loader = new THREE.TextureLoader();
  texture = loader.load("textures/sky.png")
  var sky = new THREE.Mesh(new THREE.SphereGeometry(1000, 25, 25), new THREE.MeshPhongMaterial({ map: texture, }));
  sky.material.side = THREE.BackSide;
  scene.add(sky);
  loader = new THREE.TextureLoader();
  texture = loader.load("textures/dirt.png")

  // Lock screen
  controls = new THREE.PointerLockControls(camera);
  scene.add(controls.getObject());

  raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 16);

  // Roll Over

  rollOverMesh = new THREE.Mesh(new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE), new THREE.MeshBasicMaterial({ color: 0xDDDDDD, opacity: 0.4, transparent: true }));
  scene.add(rollOverMesh);

  // Cube

  MovingCube = new THREE.Mesh(new THREE.BoxGeometry(BLOCK_SIZE, 16, BLOCK_SIZE));
  scene.add(MovingCube);

  var gltfloader = new THREE.GLTFLoader();
  gltfloader.load('textures/model.gltf', (gltf) => {
    PlayerModel = gltf.scene;
    scene.add(PlayerModel);
  });


  var simplex = new SimplexNoise();

  for (var x = 0; x < worldWidth; x++) {
    for (var z = 0; z < worldHeight; z++) {
      let y = simplex.noise2D(x, z) * 10;
      console.log(y)
      let block = new THREE.Mesh(new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE), grassMaterial);
      let OFFSET = BLOCK_SIZE / 2;
      block.position.set(x * BLOCK_SIZE - OFFSET, y * BLOCK_SIZE - OFFSET, z * BLOCK_SIZE - OFFSET);
      objects.push(block);
      collidableMeshList.push(block);
      scene.add(block);
    }
  }

  // Renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  stats.showPanel(0);
  document.body.appendChild(stats.dom);
  document.body.appendChild(renderer.domElement);

  // Event Listeners
  window.addEventListener('resize', onWindowResize, false);
  window.addEventListener('mousemove', onMouseMove, false);
  window.addEventListener('mousedown', onMouseDown, false);
  window.addEventListener("keyup", (e) => keys[e.keyCode] = false);
  window.addEventListener("keydown", (e) => {
    if (e.keyCode === 32) {
      if (canJump === true) velocity.y += 150;
      canJump = false;
    } else if (e.keyCode >= 49 && e.keyCode <= 57) {
      changeInventory(e.keyCode - 48);
    } else {
      keys[e.keyCode] = true
    }
  })
}

function changeInventory(invSlot) {
  currentMaterial = materials[invSlot - 1];
  currentMaterialIndex = invSlot - 1;
  document.getElementsByClassName('current')[0].classList.remove('current');
  document.getElementsByClassName('inv-item')[currentMaterialIndex].classList.add('current')
}

function onMouseMove(event) {
  mouse.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);

  PlayerModel.rotation.y = camera.parent.parent.rotation._y + Math.PI;

  raycaster2.setFromCamera(mouse, camera);
  var intersects = raycaster2.intersectObjects(objects);
  if (intersects.length > 0) {
    let intersect = intersects[0];
    rollOverMesh.position.copy(intersect.point).add(intersect.face.normal);
    if (intersects[0].distance < BLOCK_SIZE * 3) {
      rollOverMesh.position.divideScalar(BLOCK_SIZE).floor().multiplyScalar(BLOCK_SIZE).addScalar(BLOCK_SIZE / 2);
    } else {
      rollOverMesh.position.divideScalar(0)
    }
  }
}

function onMouseDown(event) {
  mouse.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);
  raycaster2.setFromCamera(mouse, camera);
  switch (event.buttons) {
    case 1:
      var intersects = raycaster2.intersectObjects(collidableMeshList);
      removeBlock(intersects[0])
      break;
    case 2:
      var intersects = raycaster2.intersectObjects(objects);
      if (intersects.length > 0 && intersects[0].distance < BLOCK_SIZE * 3) {
        addBlock(intersects[0], currentMaterialIndex);
      }
      break;
    default:
      break;
  }
}

function addBlock(voxel, materialIndex, uuid) {
  let block = new THREE.Mesh(new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE), materials[materialIndex]);
  block.position.copy(voxel.point).add(voxel.face.normal);
  block.position.divideScalar(BLOCK_SIZE).floor().multiplyScalar(BLOCK_SIZE).addScalar(BLOCK_SIZE / 2);
  block.uuid = uuid;
  scene.add(block);
  objects.push(block);
  collidableMeshList.push(block);
}

function removeBlock(block) {
  if (!block) return;
  objects = objects.filter(e => e.uuid != block.object.uuid)
  collidableMeshList = collidableMeshList.filter(e => e.uuid != block.object.uuid)
  scene.children.forEach(e => e.uuid == block.object.uuid ? scene.remove(e) : null)
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  stats.begin();
  requestAnimationFrame(animate);

  if (controlsEnabled) {

    raycaster.ray.origin.copy(controls.getObject().position);
    raycaster.ray.origin.y -= 1;

    var intersections = raycaster.intersectObjects(objects);

    var OnObject = intersections.length > 0;

    var time = performance.now();
    var delta = (time - prevTime) / 2000;

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= 9.8 * 100.0 * delta;

    if (keys[87]) velocity.z -= 800.0 * delta;
    if (keys[83]) velocity.z += 800.0 * delta;
    if (keys[65]) velocity.x -= 800.0 * delta;
    if (keys[68]) velocity.x += 800.0 * delta;


    if (OnObject === true) {
      velocity.y = Math.max(0, velocity.y);
      canJump = true;
    }

    controls.getObject().translateX(velocity.x * delta);
    controls.getObject().translateY(velocity.y * delta);
    controls.getObject().translateZ(velocity.z * delta);

    MovingCube.position.x = controls.getObject().position.x
    MovingCube.position.y = controls.getObject().position.y
    MovingCube.position.z = controls.getObject().position.z

    PlayerModel.position.x = getCenterPoint(MovingCube).x;
    PlayerModel.position.y = getCenterPoint(MovingCube).y;
    PlayerModel.position.z = getCenterPoint(MovingCube).z;

    var originPoint = MovingCube.position.clone();
    for (var vertexIndex = 0; vertexIndex < MovingCube.geometry.vertices.length; vertexIndex++) {
      var localVertex = MovingCube.geometry.vertices[vertexIndex].clone();
      var globalVertex = localVertex.applyMatrix4(MovingCube.matrix);
      var directionVector = globalVertex.sub(MovingCube.position);

      var ray = new THREE.Raycaster(originPoint, directionVector.clone().normalize());
      var collisionResults = ray.intersectObjects(collidableMeshList);
      if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
        let v1 = new THREE.Vector3(MovingCube.position.x, MovingCube.position.y, MovingCube.position.z)
        let center = getCenterPoint(collisionResults[0].object)
        let v2 = new THREE.Vector3(center.x, center.y, center.z)
        let dir = new THREE.Vector3();
        let vec = dir.subVectors(v2, v1).normalize();
        if (Math.abs(vec.x) > Math.abs(vec.z)) {
          if (vec.x > 0) controls.getObject().position.x = collisionResults[0].object.position.x - BLOCK_SIZE;
          else controls.getObject().position.x = collisionResults[0].object.position.x + BLOCK_SIZE;
        } else {
          if (vec.z > 0) controls.getObject().position.z = collisionResults[0].object.position.z - BLOCK_SIZE;
          else controls.getObject().position.z = collisionResults[0].object.position.z + BLOCK_SIZE;
        }
      }
    }

    if (controls.getObject().position.y < 16) {
      velocity.y = 0;
      controls.getObject().position.y = 16;
      canJump = true;
    }

    prevTime = time;

    renderer.render(scene, camera);
    stats.end();
  }
}

const getCenterPoint = (mesh) => {
  var geometry = mesh.geometry;
  geometry.computeBoundingBox();

  const center = new THREE.Vector3();
  geometry.boundingBox.getCenter(center);


  mesh.localToWorld(center);
  return center;
}
