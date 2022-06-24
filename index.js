/* global Matter */
// current version 0.18.0

const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter
//Composites, Common,
const engine = Engine.create()
const world = engine.world
const runner = Runner.create()
const render = Render.create({
  canvas: document.getElementById("root"),
  engine: engine,
  options: {
    width: window.innerWidth,
    height: window.innerHeight,
    wireframes: false,
    // wireframes: true,
    showVelocity: true,
    showCollisions: true,
    hasBounds: true,
    background: "#555"
  }
})

engine.world.gravity.y = 0
Render.run(render)
Runner.run(runner, engine)

const degreeToRadians = (degree = 0) => (degree / 180) * Math.PI
const radiansToDegree = (radians = 0) => (radians * 180) / Math.PI

const building = Bodies.rectangle(100, 300, 100, 400, {
  label: "building",
  isStatic: true,
  friction: 1,
  inertia: Infinity,
  frictionAir: 0.1,
  restitution: 0,
  rot: 0,
  render: {
    fillStyle: "#6e6e6e",
    sprite: {
      texture: "/assets/building 1x.png",
      xScale: 1,
      yScale: 1
    }
  }
})
World.add(world, building)

const Transport = {
  Vehicle({ x = 0, y = 0, angle = 0 }) {
    const wheelTireColor = "#060a19"
    const wheelXOffset = 18
    const wheelYOffset = 25
    const wheelHight = 11
    const wheelWidth = 6

    const wheelFrontLeft = Bodies.rectangle(-(wheelXOffset - 1), +wheelYOffset + 1, wheelWidth, wheelHight, {
      label: "wheelFrontLeft",
      isStatic: true,
      render: { fillStyle: wheelTireColor }
    })
    const wheelFrontRight = Bodies.rectangle(+wheelXOffset, +wheelYOffset + 1, wheelWidth, wheelHight, {
      label: "wheelFrontRight",
      isStatic: true,
      render: { fillStyle: wheelTireColor }
    })
    const wheelRearLeft = Bodies.rectangle(-(wheelXOffset - 1), -wheelYOffset, wheelWidth, wheelHight, {
      label: "wheelRearLeft",
      isStatic: true,
      render: { fillStyle: wheelTireColor }
    })
    const wheelRearRight = Bodies.rectangle(+wheelXOffset, -wheelYOffset, wheelWidth, wheelHight, {
      label: "wheelRearRight",
      isStatic: true,
      render: { fillStyle: wheelTireColor }
    })

    const body = Bodies.rectangle(+1, 0, 40, 80, {
      label: "body",
      isStatic: true,
      render: {
        fillStyle: "#a2a2a2",
        sprite: {
          texture: "/assets/vehicle 1x.png",
          xScale: 1,
          yScale: 1
        }
      }
    })

    const vehicle = Body.create({
      label: "vehicle",
      parts: [wheelFrontLeft, wheelFrontRight, wheelRearLeft, wheelRearRight, body],
      friction: 0.01,
      frictionAir: 0.1,
      restitution: 0
    })

    Body.set(vehicle, "vehicleComponents", {
      wheelFrontLeft,
      wheelFrontRight,
      wheelRearLeft,
      wheelRearRight,
      body
    })

    Body.translate(vehicle, { x, y })
    Body.setAngle(vehicle, angle)

    return vehicle
  }
}

const vehicleOne = Transport.Vehicle({ x: 450, y: 350, angle: degreeToRadians(120) })
World.add(world, vehicleOne)

const vehicleTwo = Transport.Vehicle({ x: 300, y: 450, angle: degreeToRadians(40) })
World.add(world, vehicleTwo)

const vehicleThree = Transport.Vehicle({ x: 420, y: 200, angle: degreeToRadians(-15) })
World.add(world, vehicleThree)

///////
const CONTROL_DRIVE_MODE_BY_VELOCITY = "by-velocity"
const CONTROL_DRIVE_MODE_BY_FORCE = "by-force"

let activeVehicle = vehicleOne
let activeControlDriveMode = CONTROL_DRIVE_MODE_BY_VELOCITY

let rightPressed = false
let leftPressed = false
let upPressed = false
let downPressed = false
let brakePressed = false
let useRearWheelsAsCenterOfRotation = false
///////

const deceleration = 0.001
const acceleration = 3
const brakingDeceleration = 0.2
const accelerationForce = 0.0055
const maxRotationSpeed = degreeToRadians(1)
const maxRotationSpeedOfWheel = degreeToRadians(30)

function driveByVelocity(vehicle) {
  const { wheelFrontLeft, wheelFrontRight } = vehicle.vehicleComponents

  let wheelFrontLeftRotationAngle = radiansToDegree(wheelFrontLeft.angle)

  let velYBasic = acceleration * Math.cos(degreeToRadians(wheelFrontLeftRotationAngle))
  let velXBasic = acceleration * Math.sin(degreeToRadians(wheelFrontLeftRotationAngle)) * -1

  let velX = vehicle.velocity.x
  let velY = vehicle.velocity.y

  let angle = vehicle.angle
  let wheelAngle = vehicle.angle // todo move to change value func
  const speed = parseFloat(vehicle.speed.toFixed(3))

  if (brakePressed) {
    velY = velY * (1 - brakingDeceleration)
    velX = velX * (1 - brakingDeceleration)
  } else if (upPressed) {
    velY = velYBasic
    velX = velXBasic
  } else if (downPressed) {
    velY = -1 * velYBasic
    velX = -1 * velXBasic
  } else {
    // todo add this rule also for (upPressed && upPressed)
    // todo should apply only for main axe
    velY = velY * (1 - deceleration)
    velX = velX * (1 - deceleration)
  }

  // steering
  if (leftPressed) {
    wheelAngle -= maxRotationSpeedOfWheel
    if (speed >= 1) {
      angle -= maxRotationSpeed * (downPressed ? -1 : +1)
    }
  }
  if (rightPressed) {
    wheelAngle += maxRotationSpeedOfWheel
    if (speed >= 1) {
      angle += maxRotationSpeed * (downPressed ? -1 : +1)
    }
  }

  Body.setAngle(wheelFrontLeft, wheelAngle)
  Body.setAngle(wheelFrontRight, wheelAngle)

  Body.setVelocity(vehicle, { x: velX, y: velY })
  Body.setAngle(vehicle, angle)
}

function driveByForce(vehicle) {
  const { wheelFrontLeft, wheelFrontRight, wheelRearLeft, wheelRearRight } = vehicle.vehicleComponents

  let wheelFrontLeftRotationAngle = radiansToDegree(wheelFrontLeft.angle)
  let angle = vehicle.angle
  let wheelAngle = vehicle.angle // todo move to change value func

  let forceY = accelerationForce * Math.cos(degreeToRadians(wheelFrontLeftRotationAngle))
  let forceX = accelerationForce * Math.sin(degreeToRadians(wheelFrontLeftRotationAngle)) * -1

  const speed = parseFloat(vehicle.speed.toFixed(1))

  // free roam slowdown (free moving / rolling)
  if (
    (!upPressed && !downPressed) ||
    (upPressed && downPressed) ||
    (!upPressed && !downPressed && speed < 0.1 && speed > 0)
  ) {
    forceY = 0
    forceX = 0
  }

  // braking / reverse
  if (downPressed) {
    forceY *= -1
    forceX *= -1
  }

  // steering
  if (speed > 1) {
    if (leftPressed) {
      angle -= maxRotationSpeed * (downPressed ? -1 : +1)
      wheelAngle -= maxRotationSpeedOfWheel
    }
    if (rightPressed) {
      angle += maxRotationSpeed * (downPressed ? -1 : +1)
      wheelAngle += maxRotationSpeedOfWheel
    }
  }

  let centerOfRotation = vehicle.position

  if (useRearWheelsAsCenterOfRotation) {
    if (leftPressed) {
      // to left
      centerOfRotation = wheelRearLeft.position
    } else if (rightPressed) {
      // to right
      centerOfRotation = wheelRearRight.position
    }
  }

  const appliedForce = {
    x: forceX,
    y: forceY
  }

  Body.setAngle(wheelFrontLeft, wheelAngle)
  Body.setAngle(wheelFrontRight, wheelAngle)

  Body.applyForce(vehicle, centerOfRotation, appliedForce)
  Body.setAngle(vehicle, angle)
}

function driveVehicle(vehicle, controlDriveModeName) {
  let controlDriveMode
  if (!controlDriveModeName) {
    controlDriveMode = driveByVelocity
  } else if (controlDriveModeName === CONTROL_DRIVE_MODE_BY_VELOCITY) {
    controlDriveMode = driveByVelocity
  } else if (controlDriveModeName === CONTROL_DRIVE_MODE_BY_FORCE) {
    controlDriveMode = driveByForce
  }

  controlDriveMode(vehicle)
}

let logData = {
  vehicleSpeed: activeVehicle.speed.toFixed(6),
  vehicleAngle: activeVehicle.angle.toFixed(6)
}

const logging = () => {
  let vehicleSpeed = activeVehicle.speed.toFixed(6)
  let vehicleAngle = activeVehicle.angle.toFixed(6)

  if (vehicleSpeed === logData.vehicleSpeed && vehicleAngle === logData.vehicleAngle) {
    return
  }

  logData = {
    vehicleSpeed,
    vehicleAngle
  }

  // console.log(`active vehicle _ speed: ${vehicleSpeed} angle: ${vehicleAngle}`)
}

let counter = 0
// let scaleFactor = 1.01

Events.on(runner, "afterTick", function (event) {
  counter += 1

  driveVehicle(activeVehicle, activeControlDriveMode)

  logging(activeVehicle)

  // if (counter === 40) Body.setStatic(bodyG, true)

  // if (scaleFactor > 1) {
  //   Body.scale(bodyF, scaleFactor, scaleFactor)
  //   Body.scale(compound, 0.995, 0.995)

  //   // modify bodyE vertices
  //   bodyE.vertices[0].x -= 0.2
  //   bodyE.vertices[0].y -= 0.2
  //   bodyE.vertices[1].x += 0.2
  //   bodyE.vertices[1].y -= 0.2
  //   Body.setVertices(bodyE, bodyE.vertices)
  // }

  // make bodyA move up and down
  // body is static so must manually update velocity for friction to work
  // var py = 300 + 100 * Math.sin(engine.timing.timestamp * 0.002)
  // Body.setVelocity(bodyA, { x: 0, y: py - bodyA.position.y })
  // Body.setPosition(bodyA, { x: 100, y: py })

  // // make compound body move up and down and rotate constantly
  // Body.setVelocity(compound, { x: 0, y: py - compound.position.y })
  // Body.setAngularVelocity(compound, 0.02)
  // Body.setPosition(compound, { x: 600, y: py })
  // Body.rotate(compound, 0.02)

  // every 1.5 sec
  if (counter >= 60 * 1.5) {
    // Body.setVelocity(bodyB, { x: 0, y: -10 })
    // Body.setAngle(bodyC, -Math.PI * 0.26)
    // Body.setAngularVelocity(bodyD, 0.2)

    // reset counter
    counter = 0
    // scaleFactor = 1
  }
})

window.addEventListener("keydown", function (e) {
  // console.log("keydown", e)
  if (e.keyCode === 39) {
    rightPressed = true
  } else if (e.keyCode === 37) {
    leftPressed = true
  } else if (e.keyCode === 38) {
    upPressed = true
  } else if (e.keyCode === 40) {
    downPressed = true
  } else if (e.keyCode === 32) {
    brakePressed = true
  }
})
window.addEventListener("keyup", function (e) {
  if (e.keyCode === 39) {
    rightPressed = false
  } else if (e.keyCode === 37) {
    leftPressed = false
  } else if (e.keyCode === 38) {
    upPressed = false
  } else if (e.keyCode === 40) {
    downPressed = false
  } else if (e.keyCode === 32) {
    brakePressed = false
  } else if (e.keyCode === 49) {
    // keyboard button "1'
    activeVehicle = vehicleOne
  } else if (e.keyCode === 50) {
    // keyboard button "2'
    activeVehicle = vehicleTwo
  } else if (e.keyCode === 51) {
    // keyboard button "3'
    activeVehicle = vehicleThree
  } else if (e.keyCode === 86) {
    // 'v'
    activeControlDriveMode = CONTROL_DRIVE_MODE_BY_VELOCITY
  } else if (e.keyCode === 70) {
    // keyboard button 'f'
    activeControlDriveMode = CONTROL_DRIVE_MODE_BY_FORCE
  } else if (e.keyCode === 88) {
    // keyboard button 'x'
    useRearWheelsAsCenterOfRotation = false
  } else if (e.keyCode === 67) {
    // keyboard button 'c'
    useRearWheelsAsCenterOfRotation = true
  }
})

// for debug
Object.assign(window, {
  vehicleOne,
  vehicleTwo,

  building,

  Transport,

  rightPressed,
  leftPressed,
  upPressed,
  downPressed,
  brakePressed,

  activeControlDriveMode,
  useRearWheelsAsCenterOfRotation
})

// // gui
// // const position = vehicle.position

// const gui = new dat.GUI()
// const vehicleFolder = gui.addFolder("vehicle")
// // vehicleFolder.add(position, "x", 0, 1000, 1)
// // vehicleFolder.add(vehicle.position, "y", 0, 1000, 1)
// // vehicleFolder.add(vehicle, "rot", 0, Math.PI * 2, 1)
// vehicleFolder.open()
// gui.close()

// // const cameraFolder = gui.addFolder("Camera")
// // cameraFolder.add(camera.position, "z", 0, 10, 0.01)
// // cameraFolder.open()
