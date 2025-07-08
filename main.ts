//% color=#0fbc11 icon="\uf130" block="Voice Recognition"
namespace voiceRecognition {
    let onCommandCallbacks: { [key: number]: () => void } = {};

    /**
     * Initialize the Voice Recognition module.
     * @param tx the TX pin, eg: SerialPin.P0
     * @param rx the RX pin, eg: SerialPin.P1
     */
    //% block
    export function init(tx: SerialPin, rx: SerialPin): void {
        serial.redirect(tx, rx, BaudRate.BaudRate9600);
        basic.pause(1000);
        clear();
    }

    /**
     * Clear all loaded voice commands.
     */
    //% block
    export function clear(): void {
        let cmd = pins.createBuffer(4);
        cmd.setNumber(NumberFormat.UInt8LE, 0, 0xAA); // FRAME_HEAD
        cmd.setNumber(NumberFormat.UInt8LE, 1, 0x02); // len
        cmd.setNumber(NumberFormat.UInt8LE, 2, 0x31); // FRAME_CMD_CLEAR
        cmd.setNumber(NumberFormat.UInt8LE, 3, 0x0A); // FRAME_END
        serial.writeBuffer(cmd);
        basic.pause(100);
    }

    /**
     * Load a command by its record number.
     * @param record the record number to load
     */
    //% block
    export function loadCommand(record: number): void {
        let cmd = pins.createBuffer(5);
        cmd.setNumber(NumberFormat.UInt8LE, 0, 0xAA); // FRAME_HEAD
        cmd.setNumber(NumberFormat.UInt8LE, 1, 0x03); // len
        cmd.setNumber(NumberFormat.UInt8LE, 2, 0x30); // FRAME_CMD_LOAD
        cmd.setNumber(NumberFormat.UInt8LE, 3, record);
        cmd.setNumber(NumberFormat.UInt8LE, 4, 0x0A); // FRAME_END
        serial.writeBuffer(cmd);
        basic.pause(100);
    }

    /**
     * Register code to run when a specific command is recognized.
     * @param record the record number to listen for
     * @param handler the code to run
     */
    //% block
    export function onCommand(record: number, handler: () => void): void {
        onCommandCallbacks[record] = handler;
        control.inBackground(() => {
            while (true) {
                let buf = serial.readBuffer(8);
                if (buf.length >= 5 && buf.getUint8(2) == 0x0D) { // FRAME_CMD_VR
                    let recNum = buf.getUint8(4);
                    if (onCommandCallbacks[recNum]) {
                        onCommandCallbacks[recNum]();
                    }
                }
                basic.pause(50);
            }
        });
    }
    //% block
    export function recognize(timeout: number = 50): number {
        // Send recognize command (VR module expects a certain protocol, but for MakeCode, we just listen for a response)
        let start = input.runningTime()
        while (input.runningTime() - start < timeout) {
            let buf = serial.readBuffer(8)
            // Check for a valid VR response (FRAME_CMD_VR = 0x0D)
            if (buf.length >= 5 && buf.getUint8(2) == 0x0D) {
                // buf[4] is the record number
                return buf.getUint8(4)
            }
            basic.pause(5)
        }
        return -1 // No command recognized
    }
}