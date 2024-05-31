const canvas = document.getElementById("renderCanvas");
      const infoContainer = document.getElementById("infoContainer");
      const cubeNameContainer = document.getElementById("cubeNameContainer");
      const cubeNameDiv = document.getElementById("cubeName");
      const deselectButton = document.getElementById("deselectButton");

      const engine = new BABYLON.Engine(canvas, true);

      const createScene = function () {
        const scene = new BABYLON.Scene(engine);
        const light = new BABYLON.HemisphericLight(
          "light",
          new BABYLON.Vector3(0, 1, 0),
          scene
        );
        const camera = new BABYLON.ArcRotateCamera(
          "camera",
          -Math.PI / 2,
          Math.PI / 3,
          20,
          new BABYLON.Vector3(0, 50, -100),
          scene
        );

        camera.attachControl = function () {}; // Disabling camera movement
        camera.inputs.attached.mousewheel.detachControl(canvas); // Disable camera zoom on mousewheel
        camera.inputs.attached.pointers.detachControl(canvas); // Disable camera rotation on mouse click and drag

        const tileSize = 10;
        const numTiles = 10;
        const floorMaterial1 = new BABYLON.StandardMaterial(
          "floorMaterial1",
          scene
        );
        floorMaterial1.diffuseColor = new BABYLON.Color3(1, 1, 1);
        const floorMaterial2 = new BABYLON.StandardMaterial(
          "floorMaterial2",
          scene
        );
        floorMaterial2.diffuseColor = new BABYLON.Color3(0, 0, 0);

        for (let i = 0; i < numTiles; i++) {
          for (let j = 0; j < numTiles; j++) {
            const tileMaterial =
              (i + j) % 2 === 0 ? floorMaterial1 : floorMaterial2;
            const tile = BABYLON.MeshBuilder.CreateGround(
              `tile_${i}_${j}`,
              { width: tileSize, height: tileSize },
              scene
            );
            tile.position.x = (i - numTiles / 2 + 0.5) * tileSize;
            tile.position.z = (j - numTiles / 2 + 0.5) * tileSize;
            tile.position.y = 0.01;
            tile.material = tileMaterial;
          }
        }

        function getRandomPosition(excludePositions = []) {
          let x, z;
          let isValidPosition = false;
          while (!isValidPosition) {
            x = Math.floor(Math.random() * numTiles);
            z = Math.floor(Math.random() * numTiles);
            isValidPosition = !excludePositions.some(
              (pos) => pos.x === x && pos.z === z
            );
          }
          return { x, z };
        }

        const positions = [
          getRandomPosition(),
          getRandomPosition([getRandomPosition()]),
        ];

        const cubes = positions.map((pos, index) => {
          const cube = BABYLON.MeshBuilder.CreateBox(
            `cube_${index+1}`,
            { size: tileSize * 0.8 },
            scene
          );
          cube.position.x = (pos.x - numTiles / 2 + 0.5) * tileSize;
          cube.position.z = (pos.z - numTiles / 2 + 0.5) * tileSize;
          cube.position.y = tileSize * 0.4;
          cube.material = new BABYLON.StandardMaterial(
            `cubeMaterial_${index}`,
            scene
          );
          cube.material.diffuseColor = new BABYLON.Color3(
            Math.random(),
            Math.random(),
            Math.random()
          );
          cube.checkCollisions = true;

          cube.actionManager = new BABYLON.ActionManager(scene);
          cube.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
              BABYLON.ActionManager.OnPickTrigger,
              function () {
                selectedCube = cube;
                cubeNameDiv.innerText = "Selected Cube: " + cube.name;
                cubeNameContainer.style.display = "block";
                infoContainer.style.display = "none"; // Hide the info text
              }
            )
          );

          return cube;
        });

        let selectedCube = null;

        function isOccupied(x, z) {
          return cubes.some(
            (cube) =>
              cube.position.x === x &&
              cube.position.z === z &&
              cube !== selectedCube
          );
        }

        function moveCube(direction) {
          if (!selectedCube) return;

          let newX = selectedCube.position.x;
          let newZ = selectedCube.position.z;
          switch (direction) {
            case "up":
              newZ -= tileSize;
              break;
            case "down":
              newZ += tileSize;
              break;
            case "left":
              newX -= tileSize;
              break;
            case "right":
              newX += tileSize;
              break;
          }

          const halfSize = (numTiles / 2) * tileSize;
          if (
            newX >= -halfSize &&
            newX < halfSize &&
            newZ >= -halfSize &&
            newZ < halfSize &&
            !isOccupied(newX, newZ)
          ) {
            selectedCube.position.x = newX;
            selectedCube.position.z = newZ;
          } else {
            switch (direction) {
              case "up":
                newZ -= tileSize;
                break;
              case "down":
                newZ += tileSize;
                break;
              case "left":
                newX -= tileSize;
                break;
              case "right":
                newX += tileSize;
                break;
            }

            if (
              newX >= -halfSize &&
              newX < halfSize &&
              newZ >= -halfSize &&
              newZ < halfSize &&
              !isOccupied(newX, newZ)
            ) {
              selectedCube.position.x = newX;
              selectedCube.position.z = newZ;
            }
          }
        }

        document.addEventListener("keydown", function (event) {
          switch (event.key) {
            case "ArrowUp":
              moveCube("down");
              break;
            case "ArrowDown":
              moveCube("up");
              break;
            case "ArrowLeft":
              moveCube("left");
              break;
            case "ArrowRight":
              moveCube("right");
              break;
          }
        });

        deselectButton.addEventListener("click", function () {
          selectedCube = null;
          cubeNameContainer.style.display = "none";
          infoContainer.style.display = "block";
        });

        return scene;
      };

      const scene = createScene();

      engine.runRenderLoop(function () {
        scene.render();
      });

      window.addEventListener("resize", function () {
        engine.resize();
      });