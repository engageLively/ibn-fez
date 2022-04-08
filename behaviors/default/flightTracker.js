class FlightTrackerActor {
    setup() {
        this.scriptListen("processFlight", this.processFlight);
        this.scriptListen("updateFlight", this.updateFlight);
        this.planes = new Map();
    }

    processFlight(flightData) {      // addarray data to map
        let now = this.now();
        flightData.forEach(fd => this.planes.set(fd[0], [now, fd[1], fd[2]]));
    }

    updateFlight() { //completed the map, now GC and inform view
        let now = this.now();
        let gcList = [];
        this.planes.forEach((value, key) => {
            if (now - value[0] > 120000) {
                gcList.push(key);
            }
        }); // remove record older than twi minutes
        gcList.forEach(key => this.planes.delete(key));
        this.say("displayFlight");
    }
}

class FlightTrackerPawn {
    setup() {
        this.scriptListen("displayFlight", this.displayFlight);
        this.constructEarth();
        this.chunkSize = 100; //number of plane records to send

        // I have a trouble thinking about the right thing to do here.
        // this is awful to just check the value.
        // this.say("electionStatusRequested");
        if (this.electedViewId === this.viewId) {
            this.handleElected();
        }
    }

    constructEarth() {
        // Create the earth
        const SHADOWRADIUS = 3.95; // size of the earth (water)
        const BASERADIUS = 4;      // size of the earth (land)
        const earthbase = `./assets/images/earthbase.png`;
        const earthshadow = `./assets/images/earthshadow.jpg`;
        const ball = './assets/images/ball.png';

        const THREE = Worldcore.THREE;

        this.shape.children.forEach((c) => {
            c.material.dispose();
            this.shape.remove(c);
        });
        this.shape.children = []; // ??
        
        const earthBaseTexture = new THREE.TextureLoader().load(earthbase);
        earthBaseTexture.wrapS = earthBaseTexture.wrapT = THREE.RepeatWrapping;
        earthBaseTexture.repeat.set(1,1);

        const earthShadowTexture = new THREE.TextureLoader().load(earthshadow);
        earthShadowTexture.wrapS = earthShadowTexture.wrapT = THREE.RepeatWrapping;
        earthShadowTexture.repeat.set(1,1);

        this.shadowSphere = new THREE.Mesh(
            new THREE.SphereGeometry(SHADOWRADIUS, 64, 64),
            new THREE.MeshStandardMaterial({ map: earthShadowTexture, color: 0x222222, roughness: 0.7, opacity:0.9, transparent: true }));
        this.shadowSphere.receiveShadow = true;
        this.shape.add(this.shadowSphere);

        this.baseSphere = new THREE.Mesh(
            new THREE.SphereGeometry(BASERADIUS, 64, 64),
            new THREE.MeshStandardMaterial({ alphaMap: earthBaseTexture, color: this.actor._cardData.color, roughness: 0.7, opacity:0.9, transparent: true }));
        this.baseSphere.receiveShadow = true;
        this.baseSphere.castShadow = true;
        this.shape.add(this.baseSphere);

        let geometry = new THREE.BufferGeometry();
        const vertices = [];
        vertices.push(0,0,0);
        const sprite = new THREE.TextureLoader().load(ball);
        geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
        let material = new THREE.PointsMaterial( { size: 0.075, sizeAttenuation: true, map: sprite, alphaTest: 0.5, transparent: true } );
        material.color.set( 0xffaa33 );

        this.planes = new THREE.Points( geometry, material );
        this.shape.add( this.planes );
        this.displayFlight();
    }

    processFlight() {
        let len = this.rawPlanes.length;
        let nextTime = 100;
        if (len === 0) {
            if (!this.gettingFlight) this.getFlight();
        } else {
            //send the rawPlanes data to model
            let n = Math.min(len, this.sendex + this.chunkSize);
            let sendArray = this.rawPlanes.slice(this.sendex, n)
            this.say("processFlight", sendArray);
            this.sendex += this.chunkSize;
            if (this.sendex > len) {
                this.rawPlanes = [];
                this.say("updateFlight");
                nextTime = 5000;
            }
        }
        this.future(nextTime).processFlight();
    }

    displayFlight() {
        const THREE = Worldcore.THREE;
        const BASERADIUS = 4;      // size of the earth (land)

        const vertices = [];
        let e = new THREE.Euler();
        let v = new THREE.Vector3();
        this.actor.planes.forEach(val=>{
            // val[1] long
            // val[2] lat
            let lon = Math.PI * 2 * val[1] / 360;
            let lat = Math.PI * 2 * val[2] / 360;
            v.set(BASERADIUS + 0.05, 0, 0);
            e.set(0, lon, lat);
            v.applyEuler(e);
            vertices.push( v.x, v.y, v.z );
        });
        this.planes.geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
    }

    handleElected() {
        this.rawPlanes = [];
        this.processFlight();
    }

    handleUnelected() {
        this.closeSocket();
    }

    closeSocket() {
        if (this.socket) {
            this.socket.close();
        }
    }

    getFlight() {
        let count = 0;
        this.sendex = 0;
        console.log("getFlight")
        this.gettingFlight = true;
        // https://opensky-network.org/apidoc/rest.html
        fetch('https://opensky-network.org/api/states/all')
            .then(response => {
                if (response.ok) {
                    response.json().then(data => {
                        // Markers
                        data.states.forEach(plane => {
                            if (!plane[6] || !plane[5]) return;
                            this.rawPlanes.push([plane[0],plane[5], plane[6], this.now()]);
                        });
                        this.gettingFlight = false;
                    });
                } else {
                    console.log('Network response was not ok.');
                }
            })
            .catch(error => console.log(error));
    }
}

export default {
    modules: [
        {
            name: "FlightTracker",
            actorBehaviors: [FlightTrackerActor],
            pawnBehaviors: [FlightTrackerPawn],
        }
    ]
}

/* globals Worldcore */