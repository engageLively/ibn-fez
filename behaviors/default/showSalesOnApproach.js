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

        this.future(1000).step();
        // this.addEventListener('pointerDown', 'showDistance')
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
            console.log("In AnimateOnApproach: no cards found")
            return []
        }
        const avatars = cards.filter(a => a.playerId)
        if (avatars.length == 0) {
            console.log(`In ShowSalesOnApproach: ${cards.length} cards found, but no avatars}`)
        }
        return avatars;

    }

    

    showCard() {
        const salesCard = {
            name: "salesCard",
            translation: [2.22658000718942, -0.3207103775912594, -33.55194820630596],
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
            behaviorModules: ["Canvas"]
        }
        if (this.salesCard) {
            // already showing it, return
            return
        }
        this.salesCard = this.createCard(salesCard)

    }

    removeCard() {
        if (this.salesCard) {
            this.salesCard.destroy();
            this.salesCard = null;
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
                this.showCard();
            } else {
                this.removeCard()
                
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
