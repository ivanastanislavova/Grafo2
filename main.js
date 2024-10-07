import ForceGraph3D from '3d-force-graph';
import * as THREE from 'three';


    const imgs = [
      { img: 'imagen.png', description: 'Root node' },
      { img: 'aladelta.jpeg', description: 'Normal node' },
      { img: 'satelite.png', url: 'https://www.google.es/', description: 'Normal node' },
      { img: 'Logo_PCUV.jpg', url: 'https://www.google.es/', description: 'Normal node' },
      { img: 'logo_irtic.jpeg', url: 'https://www.google.es/', description: 'Normal node' },
      { img: 'LogoArtec.png', url: 'https://www.google.es/', description: 'Terminal node' },
      { img: 'edificio.jpeg', url: 'https://www.google.es/', description: 'Terminal node' },
      { img: 'medicina.jpeg', url: 'https://www.google.es/', description: 'Terminal node' }
    ];

    const gData = {
      nodes: imgs.map((item, id) => ({ id, img: item.img, url: item.url, description: item.description })),
      links: [
        { source: 0, target: 1 },
        { source: 0, target: 2 },
        { source: 0, target: 3 },
        { source: 0, target: 4 },
        { source: 1, target: 5 },
        { source: 2, target: 6 },
        { source: 3, target: 7 }
      ]
    };

    const Graph = ForceGraph3D()
      (document.getElementById('3d-graph'))
      .nodeThreeObject(node => {
        const imgTexture = new THREE.TextureLoader().load(`./imgs/${node.img}`);
        imgTexture.colorSpace = THREE.SRGBColorSpace;

        const geometry = new THREE.SphereGeometry(6, 32, 32);
        const material = new THREE.MeshBasicMaterial({ map: imgTexture });
        const sphere = new THREE.Mesh(geometry, material);

        return sphere;
      })
      .graphData(gData)
      .linkColor(() => '#c4e3ed')
      .onNodeClick(node => {
        const distance = 40;
        const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

        const newPos = {
          x: node.x * distRatio,
          y: node.y * distRatio,
          z: node.z * distRatio
        };

        Graph.cameraPosition(
          newPos, 
          { x: node.x, y: node.y, z: node.z }, 
          3000  
        );
      });

    document.getElementById('zoom-out').addEventListener('click', () => {
      Graph.cameraPosition(
        { x: 0, y: 0, z: 400 },
        { x: 0, y: 0, z: 0 },   
        3000 
      );
    });

    document.getElementById('3d-graph').addEventListener('dblclick', (event) => {
      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, Graph.camera());

      const intersects = raycaster.intersectObjects(Graph.scene().children, true);
      if (intersects.length > 0) {
        const clickedNode = intersects[0].object;

        const node = gData.nodes.find(n => clickedNode.material.map.image.src.includes(n.img));
        if (node) {
          if (node.img === 'imagen.png') {
            fetch('http://localhost:8080/?app=calc.exe')
              .then(response => response.json())
              .then(data => console.log(data))
              .catch(error => console.error('Error:', error));
          } else if (node.img === 'aladelta.jpeg') {
            document.getElementById('video-container').style.display = 'flex';
            document.getElementById('video-player').play();
            Graph.controls().enabled = false;
          } else {
            window.open(node.url, '_blank');
          }
          return;
        }
      }

      Graph.cameraPosition(
        { x: 0, y: 0, z: 400 }, 
        { x: 0, y: 0, z: 0 },
        3000
      );
    });

    document.getElementById('close-video').addEventListener('click', () => {
      document.getElementById('video-container').style.display = 'none';
      document.getElementById('video-player').pause();
      Graph.controls().enabled = true;
    });

    // Load the skybox textures
    const loader = new THREE.CubeTextureLoader();
    const skyboxTexture = loader.load([
      './skybox/skybox_right.png', // right
      './skybox/skybox_left.png', // left
      './skybox/skybox_up.png', // top
      './skybox/skybox_down.png', // bottom
      './skybox/skybox_front.png', // front
      './skybox/skybox_back.png'  // back
    ]);

    // Set the scene background to the skybox
    Graph.scene().background = skyboxTexture;

    window.addEventListener('resize', () => {
      Graph.width(window.innerWidth);
      Graph.height(window.innerHeight);
    });

    // Another background video for the skybox
    /*
    const video = document.createElement('video');
    video.src = './background/backgroundfootage.mp4'; 
    video.loop = true;
    video.muted = true;
    video.play();

    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.colorSpace = THREE.SRGBColorSpace;

    const skyboxGeo = new THREE.SphereGeometry(1000, 100, 100); 
    const skyboxMat = new THREE.MeshStandardMaterial({
      map: videoTexture,
      side: THREE.BackSide,
      transparent: false
    });

    const skybox = new THREE.Mesh(skyboxGeo, skyboxMat);
    Graph.scene().add(skybox);
    */


    // Function to export gData to JSON
    const exportToJson = () => {
      const dataStr = JSON.stringify(gData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

      const exportFileDefaultName = 'graphData.json';

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    };

    document.getElementById('export-json').addEventListener('click', exportToJson);

    // Animation loop to make spheres look at the camera
    const animate = () => {
      requestAnimationFrame(animate);
      Graph.scene().traverse((child) => {

        if (child instanceof THREE.Mesh && child.geometry instanceof THREE.SphereGeometry) {
       
          child.lookAt(Graph.camera().position);
        }
      });
      Graph.renderer().render(Graph.scene(), Graph.camera());
    };

    animate();