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

    //% block
    export function checkRecognizer(): void {
        wakeRecognizer()
        sendCommand([0xAA, 0x02, 0x01, 0x0A])
    }

    //% block
    export function loadRecords(records: number[]): void {
        let len = 2 + records.length
        let cmd = [0xAA, len, 0x30].concat(records)
        cmd.push(0x0A)
        sendCommand(cmd)
    }

    //% block="initialize recognizer with records %records"
    export function initializeRecognizer(records: number[]): void {
        wakeRecognizer()
        basic.pause(200)
        loadRecords(records)
    }

    let lastVoiceCommand = ""

    //% block="start listening for voice commands"
    export function startListening(callback: (text: string) => void): void {
        control.inBackground(function () {
            while (true) {
                let received = serial.readUntil("\n")
                if (received) {
                    lastVoiceCommand = received.trim()
                    callback(lastVoiceCommand)
                }
            }
        })
    }

    //% block="get last command"
    export function getRecognizedText(): string {
        return lastVoiceCommand
    }
}

// Separate helper namespace
namespace VoiceBuffer {

    export function readByte(buf: Buffer, offset: number): number {
        return buf.getNumber(NumberFormat.UInt8LE, offset)
    }

    export function isCommand(buf: Buffer, cmd: number): boolean {
        return readByte(buf, 0) == 0xAA && readByte(buf, 2) == cmd
    }

    export function getRecordNumber(buf: Buffer): number {
        return readByte(buf, 3)
    }

    /**
     * Send a load command to activate specific record IDs
     * @param records array of record numbers to load
     */
    //% block="load voice records %records"
    //% weight=90
    export function loadVoiceRecords(records: number[]): void {
        let len = 2 + records.length
        let cmd = [0xAA, len, 0x30].concat(records)
        cmd.push(0x0A)

        let buffer = pins.createBuffer(cmd.length)
        for (let i = 0; i < cmd.length; i++) {
            buffer.setNumber(NumberFormat.UInt8LE, i, cmd[i])
        }


    }
}
