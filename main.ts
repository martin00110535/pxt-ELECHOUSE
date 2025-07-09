//% weight=100 color=#0fbc11 icon="\uf130"
namespace VRModule {

    function sendCommand(cmd: number[]): void {
        let buffer = pins.createBuffer(cmd.length)
        for (let i = 0; i < cmd.length; i++) {
            buffer.setNumber(NumberFormat.UInt8LE, i, cmd[i])
        }
        serial.writeBuffer(buffer)
    }

    //% block="wake recognizer"
    export function wakeRecognizer(): void {
        serial.writeString("settings\r\n")
    }

    //% block="load voice records %records"
    export function loadRecords(records: number[]): void {
        if (!records || records.length == 0) return

        let len = 1 + records.length  // Correct LEN field
        let cmd = [0xAA, len, 0x30].concat(records)
        cmd.push(0x0A)

        let buffer = pins.createBuffer(cmd.length)
        for (let i = 0; i < cmd.length; i++) {
            buffer.setNumber(NumberFormat.UInt8LE, i, cmd[i])
        }

        serial.writeBuffer(buffer)

        control.inBackground(function () {
            basic.pause(300)  // Give module time to reply
            let response = serial.readBuffer(20)
            basic.showString(response.toHex())  // Debug output

            if (response.length >= 5 && response.getNumber(NumberFormat.UInt8LE, 2) == 0x30) {
                let statusCode = response.getNumber(NumberFormat.UInt8LE, 4)
                switch (statusCode) {
                    case 0x00: basic.showString("Loaded"); break
                    case 0xFC: basic.showString("Already"); break
                    case 0xFD: basic.showString("Full"); break
                    case 0xFE: basic.showString("Untrained"); break
                    case 0xFF: basic.showString("Invalid"); break
                    default: basic.showString("Err")
                }
            } else {
                basic.showString("No response")
            }
        })
    }


    //% block="initialize recognizer with records %records"
    export function initializeRecognizer(records: number[]): void {
        wakeRecognizer()
        basic.pause(200)
        loadRecords(records)
    }

    //% block="start listening for voice commands"
    export function startListening(callback: (text: string) => void): void {
        control.inBackground(function () {
            while (true) {
                let received = serial.readUntil("\n")
                if (received) {
                    callback(received.trim())
                }
            }
        })
        serial.onDataReceived("\n", function () {
        let received = serial.readString()
        basic.showString(received.trim())
})
    }

    //% block="check recognizer status and show loaded records"
    export function checkRecognizer(): void {
        sendCommand([0xAA, 0x02, 0x01, 0x0A])  // Request recognizer status

        control.inBackground(function () {
            basic.pause(1000)  // Give the module time to reply
            let response = serial.readBuffer(64)  // Adjust length if needed


            if (response.length > 0) {
                basic.showString(response.toHex())
            } else {
                basic.showString("Empty")
            }

            if (response.getNumber(NumberFormat.UInt8LE, 2) == 0x01) {
                let numRecords = response.getNumber(NumberFormat.UInt8LE, 3)
                let result = ""
                for (let i = 0; i < numRecords; i++) {
                    let rec = response.getNumber(NumberFormat.UInt8LE, 4 + i)
                    result += rec + " "
                }
                basic.showString("Loaded: " + result.trim())
            } else {
                basic.showString("No records")
            }
        })
    }

}
