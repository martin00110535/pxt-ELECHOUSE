/**
 * Voice Recognition V2/V3 MakeCode extension (partial port from Arduino C++)
 * Adapted for MakeCode and micro:bit by Copilot
 *
 * Note: Actual hardware UART/serial access may be limited on MakeCode targets.
 * Only one serial port is available on micro:bit, so use wisely.
 */

const FRAME_HEAD = 0xAA;
const FRAME_END = 0x0A;
// Define other frame command constants as needed...

// Utility: Convert a number to 2-digit hex string
function toHex(val: number): string {
    return val.toString(16).toUpperCase().padStart(2, "0");
}

namespace voiceRecognition {
    // Internal buffer
    let vr_buf: number[] = [];

    /**
     * Send a command packet to the voice recognition module.
     * 
     * @param cmd Command byte
     * @param data Optional payload
     */
    function sendPacket(cmd: number, data?: number[]): void {
        let packet: number[] = [];
        packet.push(FRAME_HEAD);
        if (data && data.length > 0) {
            packet.push(data.length + 1);
            packet.push(cmd);
            packet = packet.concat(data);
        } else {
            packet.push(2); // length
            packet.push(cmd);
        }
        packet.push(FRAME_END);
        // Send over serial
        serial.writeBuffer(Buffer.fromArray(packet));
    }

    /**
     * Receive a response packet from the module.
     * Returns the buffer if a valid packet is received, undefined otherwise.
     */
    function receivePacket(timeout: number = 1000): number[] | undefined {
        let start = input.runningTime();
        let buf: number[] = [];
        while (input.runningTime() - start < timeout) {
            if (serial.readable()) {
                let b = serial.read();
                buf.push(b);
                // Check if we have a complete frame
                if (buf.length > 2 && buf[0] == FRAME_HEAD && buf[buf.length - 1] == FRAME_END) {
                    return buf;
                }
            }
        }
        return undefined;
    }

    /**
     * Recognize voice command.
     * Returns recognized index or -1 on failure.
     */
    //% block
    export function recognize(timeout: number = 1000): number {
        sendPacket(/*FRAME_CMD_VR*/ 0x22);
        let resp = receivePacket(timeout);
        if (resp && resp.length > 4 && resp[2] == /*FRAME_CMD_VR*/ 0x22) {
            return resp[4]; // Example: return recognized index
        }
        return -1;
    }

    /**
     * Train a new record.
     */
    //% block
    export function train(record: number): boolean {
        sendPacket(/*FRAME_CMD_TRAIN*/ 0x31, [record]);
        let resp = receivePacket(2000);
        if (resp && resp[2] == /*FRAME_CMD_TRAIN*/ 0x31) {
            return true;
        }
        return false;
    }

    /**
     * Clear all records.
     */
    //% block
    export function clear(): boolean {
        sendPacket(/*FRAME_CMD_CLEAR*/ 0x33);
        let resp = receivePacket();
        return !!resp && resp[2] == /*FRAME_CMD_CLEAR*/ 0x33;
    }

    // Add more methods as needed (load, setSignature, etc.)
}