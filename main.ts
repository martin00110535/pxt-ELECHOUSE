//% weight=100 color=#0fbc11 icon="\uf130"
namespace VRModule {

    function sendCommand(cmd: number[]): void {
        let buffer = pins.createBuffer(cmd.length)
        for (let i = 0; i < cmd.length; i++) {
            buffer.setUint8(i, cmd[i])
        }
        serial.writeBuffer(buffer)
    }

    //% block="wake recognizer"
    export function wakeRecognizer(): void {
        serial.writeString("settings\r\n") // Or just "settings" if no terminator needed
    }


    //% block
    export function checkRecognizer(): void {
        wakeRecognizer()                 // Wake the device
        sendCommand([0xAA, 0x02, 0x01, 0x0A]) // Run original command after waking
    }

    //% block
    export function loadRecords(records: number[]): void {
        let len = 2 + records.length
        let cmd = [0xAA, len, 0x30].concat(records)
        cmd.push(0x0A)
        sendCommand(cmd)
    }
    //% block="initialize recognizer with records %records"
    //% weight=90
    export function initializeRecognizer(records: number[]): void {
        // Wake the module by loading records into recognizer
        let len = 2 + records.length
        let cmd = [0xAA, len, 0x30].concat(records)
        cmd.push(0x0A)
        serial.writeString("settings\r\n") // Optional wake-up string if needed
        basic.pause(200) // Give the module time to respond
        sendCommand(cmd)
    }


    //% block
    export function listen(callback: (data: string) => void): void {
        control.inBackground(function () {
            while (true) {
                let received = serial.readUntil("\n")
                if (received) {
                    callback(received)
                }
            }
        })
    }

    //% block="trim string %text"
    //% weight=70
    export function trimString(text: string): number {
        return parseFloat(text.trim())
    }

    let lastVoiceCommand = -1 // Keeps track of recognized command

    //% block="get recognized voice command"
    //% weight=80
    export function getRecognizedCommand(): number {
        return lastVoiceCommand
    }

    //% block="start listening for voice commands"
    //% weight=85
    export function startListening(): void {
        control.inBackground(function () {
            while (true) {
                let received = serial.readUntil("\n")
                if (received) {
                    let trimmed = VRModule.trimString(received)
                    let command = parseFloat(trimmed) // Convert to number
                    lastVoiceCommand = command
                }
            }
        })
    }

}
