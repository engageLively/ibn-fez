// Copyright 2022 by Croquet Corporation, Inc. All Rights Reserved.
// https://croquet.io
// info@croquet.io



class CanvasActor{
    setup() {
        this.listen("drawPointActor", "drawPoint")
        this.subscribe("global", "drawTextActor", "drawText")
        // this.future(1000).drawText();
        
        // this.future(1000).step()
    }

    drawText(data) {
        let {name, text} = data;
        if (name != this._name) {
            // not for us, return
            return
        }
        this.say("drawTextPawn", text)
    }

    step() {
        console.log('CanvasActor step')
        this.say("drawAll");
        this.future(50).step()

    }

    drawPoint(data) {
        let {viewId, x, y} = data;
        this.say("drawPointPawn", data)
    }
}

class CanvasPawn {

    setup() {
        this.listen("drawAll", "drawAll")
        this.listen("drawPointPawn", "drawPoint")
        this.listen("drawTextPawn", "drawText")
        this.index = 0;
        this.angle = 0;
        // this.addEventListener('pointerDown', 'pointerDown')
        this.clear('black')
        this.texture.needsUpdate = true;
    }

    /* pointerDown(evt) {
        this.say("drawPointActor", {viewId: this.viewId, x: evt.xy[0], y:evt.xy[1]})
    } */

    drawPoint(data) {
        let {viewId, x, y} = data;
        let ctx = this.canvas.getContext("2d");
        ctx.beginPath();
        ctx.rect(x, y, 5, 5);
        ctx.fillStyle = ctx.strokeStyle = 'white';
        ctx.stroke();
        ctx.fill();
        ctx.closePath();
        this.texture.needsUpdate = true;
    }

    drawText(text) {
        this.clear('black')
        let ctx = this.canvas.getContext("2d");
        ctx.font = "30px Arial";
        ctx.fillStyle = 'white'
        ctx.fillText(text, 10, 50);
        this.texture.needsUpdate = true;

    }


    _drawSpiral(angle) {
        const colors = ['red', 'green', 'blue'];
        let ctx = this.canvas.getContext("2d");
        for (let i = 0; i < 500; i++) {
            const color = colors[i % colors.length];
            const theta = 0.1 * i + angle;
            let x = i * Math.cos(theta) + this.canvas.width/2;
            let y = i * Math.sin(theta) + this.canvas.height/2;
            ctx.beginPath();
            ctx.moveTo(x + 5, y);
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = ctx.strokeStyle = color;
            ctx.stroke();
            ctx.fill();
            ctx.closePath();
            
        }

    }

    

    clear(fill) {
        let ctx = this.canvas.getContext("2d");
        // console.log(ctx)
        ctx.fillStyle = fill;
        ctx.fillRect( 0, 0, this.canvas.width, this.canvas.height );
        
    }

    drawAll() {
        console.log('CanvasPawn drawAll')
        const colors = ['#ff0000', '#00ff00', '#00ffff']
        this.clear('black')
        this._drawSpiral(this.angle)
        this.angle += 0.1;
        this.texture.needsUpdate = true;
    }

    
}

class BuyActor {
    setup() {
        this.subscribe("global", "currentInventory", "storeInventory")
        this.listen('purchaseRequested', 'buy')
    }
    storeInventory(name) {
        this.currentInventory = name;
    }
    buy(name) {
        this.publish("global", "buy", this.currentInventory)
    }
}

class BuyPawn {
    setup() {
        this.addEventListener('pointerDown', 'pointerDown')
    }
    pointerDown() {
        this.say('purchaseRequested')
    }
}




export default {
    modules: [
        {
            name: "Canvas",
            actorBehaviors: [CanvasActor],
            pawnBehaviors: [CanvasPawn],
        },
        {
            name: 'Buy',
            actorBehaviors: [BuyActor],
            pawnBehaviors: [BuyPawn]
        }
    ]
}

/* globals Microverse */
