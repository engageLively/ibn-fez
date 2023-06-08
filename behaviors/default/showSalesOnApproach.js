// animateOnApproach
// Copyright 2023 Ultisim and engageLively
// Croquet Microverse
// animate a card when an avatar approaches


class ShowSalesOnApproach {

    _setField(field, defaultValue) {
        const fieldSupplied = this._cardData[field];
        this[field] = fieldSupplied?this._cardData[field]:defaultValue;
    }
    

    setup() {
        this.proximate  = false; // start with no one around
        this._loadFields();
        console.log('Setup for card ' + this._cardData.name)
        this._dumpFields();
        this.salesCard = null;
        this.goods = [
            {name: "camel", quantity: 3, price: 250},
            {name: "saddle", quantity: 20, price: 50},
            {name: "blanket", quantity: 50, price: 10}
        ]
        this.showing = false;
        this.avatarValue = {
            camel: 0, saddle: 0, blanket: 0, shells:500
        }
        this.subscribe("global", "buy", "purchase")

        this.future(1000).step();
        // this.addEventListener('pointerDown', 'showDistance')
    }

    purchase(name) {
        const purchased = this.goods.filter(good => good.name == name)[0]
        this.goodsIndex = this.goods.indexOf(purchased)
        purchased.quantity--;
        this.avatarValue[name]++;
        this.avatarValue.shells -= purchased.price
        this.updateDisplay()
    }

    _loadFields() {
        // set up the configuration from the card
        const fields = [
            {name: 'showSalesProximateDistance', defaultValue: 10},
            {name: 'showSalesCheckInterval', defaultValue: 20}
        ]

        fields.forEach(field => {
            this._setField(field.name, field.defaultValue)
        })

    }

    _dumpFields() {
        const fields = ['showSalesProximateDistance', 'showSalesCheckInterval']
        console.log('Fields for ' + this._cardData.name);
        fields.forEach(field => {
            console.log(field + ': ' + this[field])
        })
    }

    _distanceSquare(avatar) {
        const xDist = avatar.translation[0] - this.translation[0]
        const zDist = avatar.translation[2] - this.translation[2]
        return xDist*xDist + zDist*zDist

    }

    // used for debugging only

    _showDistance() {
        const avatars = this._avatars();
        const dist = avatars.map(av => this._distanceSquare(av));
        console.log(`Distance is ${dist}`)
        return;

    }

    // get all of the avatars

    _avatars() {

        const cards = this.queryCards();
        if (cards.length == 0) {
            console.log("In ShowSalesOnApproach: no cards found")
            return []
        }
        const avatars = cards.filter(a => a.playerId)
        if (avatars.length == 0) {
            console.log(`In ShowSalesOnApproach: ${cards.length} cards found, but no avatars}`)
        }
        return avatars;

    }

    

    showCards() {
        if (this.showing) {
            return; // nothing to do
        }

        const displayCards = [
            {
                name: "goodsCard",
                translation: [2.22658000718942, -0.3207103775912594, -33.55194820630596],
                behaviorModules: ["Canvas", "Buy"]
            },
            {
                name: "avatarCard",
                translation: [5.22658000718942, -0.3207103775912594, -33.55194820630596],
                behaviorModules: ["Canvas"]
            }
        ]

        const salesCards = displayCards.map(card => {
            return {
                name: card.name,
                translation: card.translation,
                behaviorModules: card.behaviorModules,
                rotation: [0, 0, 0, 1],
                scale: [3, 3, 3],
                type: "2d",
                textureType: "canvas",
                textureWidth: 1024,
                textureHeight: 768,
                width: 1,
                height: 0.75,
                // color: 0xffffff,
                depth: 0.05,
                cornerRadius: 0.1,
            }
        })
        
        this.showing = true;
        this.popupCards = salesCards.map(card => this.createCard(card))
        this.goodsIndex = 0;
        this.future(100).displayCardValues();

    }

    displayCardValues() {
        if (this.showing) { 
            this.updateDisplay();
            this.goodsIndex = (this.goodsIndex + 1) % this.goods.length;
            this.future(5000).displayCardValues();
        }

    }

    updateDisplay() {
        this.publish("global", "drawTextActor", {
            name: "goodsCard",
            text: JSON.stringify(this.goods[this.goodsIndex])
        })
        this.publish("global", "currentInventory", this.goods[this.goodsIndex].name)
        this.publish("global", "drawTextActor", {
            name: "avatarCard",
            text: JSON.stringify(this.avatarValue)
        })

    }

    removeCards() {
        if (this.showing) {
            this.showing = false;
            if (this.popupCards) {
                this.popupCards.forEach(card => card.destroy())
                this.popupCards = [];
            }
        }
    }

    step() {
        this._loadFields();
        const avatars = this._avatars();
        if (avatars.length > 0) {
            const distances = avatars.map(avatar => this._distanceSquare(avatar))
            const minDistance = distances.slice(1).reduce((prev, cur) => Math.min(prev, cur), distances[0])
            // console.log(minDistance)
            if (minDistance < this.showSalesProximateDistance){
                this.showCards();
            } else {
                this.removeCards()
                
            }
            this.future(this.showSalesCheckInterval).step();

            
        } else {
            this._cardData.animationClipIndex = this.animationDistantAnimationClip;
        }
    }

    setFinal() {
        this._cardData.animationClipIndex = this.animationDistantAnimationClip;
        this.translateTo( this._cardData.translationAfterJump);
    }

   
    teardown() {
        
    }
}

export default {
    modules: [
        {
            name: "ShowSalesOnApproach",
            actorBehaviors: [ShowSalesOnApproach],
        }
    ]
}
