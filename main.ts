//% weight=100 color=#0fbc11 icon="\uf130"
namespace VRModule {
    serial.redirect(TX, RX, BAUD)

    function sendCommand(cmd: number[]): void {
        let buffer = pins.createBuffer(cmd.length)
        for (let i = 0; i < cmd.length; i++) {
            buffer.setUint8(i, cmd[i])
        }
        serial.writeBuffer(buffer)
    }

    //% block
    export function checkRecognizer(): void {
        sendCommand([0xAA, 0x02, 0x01, 0x0A])
    }

    //% block
    export function loadRecords(records: number[]): void {
        let len = 2 + records.length
        let cmd = [0xAA, len, 0x30].concat(records)
        cmd.push(0x0A)
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
    export function trimString(text: string): string {
        return text.trim()
    }
}
