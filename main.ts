//% weight=100 color=#0fbc11 icon="\uf130"
namespace VRModule {

    let serialInitialized = false

    function ensureSerial(): void {
        if (!serialInitialized) {
            serial.redirect(SerialPin.P1, SerialPin.P0, BaudRate.BaudRate9600)
            basic.pause(100)
            serialInitialized = true
        }
    }

    function sendCommand(cmd: number[]): void {
        ensureSerial()
        let buffer = pins.createBuffer(cmd.length)
        for (let i = 0; i < cmd.length; i++) {
            buffer.setNumber(NumberFormat.UInt8LE, i, cmd[i])
        }
        serial.writeBuffer(buffer)
    }

    //% block="module LED blink %on"
    export function setLedBlink(on: boolean): void {
        let cmd = [0xAA, 0x04, 0x36, 0x00, on ? 1 : 0, 0x0A]
        sendCommand(cmd)
    }

    //% block="wake recognizer"
    export function wakeRecognizer(): void {
        ensureSerial()
        serial.writeString("settings\r\n")
    }

    //% block="load voice records %records"
    export function loadRecords(records: number[]): void {
        if (!records || records.length == 0) return

        ensureSerial()
        let len = 1 + records.length
        let cmd = [0xAA, len, 0x30].concat(records)
        cmd.push(0x0A)
        sendCommand(cmd)

        control.inBackground(function () {
            basic.pause(500)
            let response = serial.readBuffer(32)
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
        basic.pause(300)
        loadRecords(records)
    }

    //% block="start voice recognition"
    export function startRecognition(): void {
        ensureSerial()
        control.inBackground(() => {
            while (true) {
                serial.writeBuffer(pins.createBufferFromArray([0xAA, 0x02, 0x07, 0x0A]))
                basic.pause(300)
                let resp = serial.readBuffer(8)
                if (resp.length >= 4 && resp.getNumber(NumberFormat.UInt8LE, 2) == 0x07) {
                    let recId = resp.getNumber(NumberFormat.UInt8LE, 3)
                    control.raiseEvent(0x1000, recId)
                }
            }
        })
    }

    //% block="start listening for text responses"
    export function startListening(callback: (text: string) => void): void {
        ensureSerial()
        serial.onDataReceived("\n", function () {
            let received = serial.readString().trim()
            callback(received)
        })
    }

    //% block="check recognizer status and show loaded records"
    export function checkRecognizer(): void {
        sendCommand([0xAA, 0x02, 0x01, 0x0A])

        control.inBackground(function () {
            basic.pause(1000)
            let response = serial.readBuffer(64)
            if (response.length == 0) {
                basic.showString("Empty")
                return
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
