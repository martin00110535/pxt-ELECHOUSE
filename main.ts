const FRAME_HEAD = 0xAA;
const FRAME_END = 0x0A;

namespace voiceRecognition {
    //% block
    export function recognize(timeout: number = 1000): number {
        sendPacket(0x22);
        let resp = receivePacket(timeout);
        if (resp && resp.length > 4 && resp[2] == 0x22) {
            return resp[4];
        }
        return -1;
    }

    //% block
    export function train(record: number): boolean {
        sendPacket(0x31, [record]);
        basic.pause(1000); // Give user time to speak
        let resp = receivePacket(2000);
        if (resp && resp[2] == 0x31) {
            return true;
        }
        return false;
    }

    //% block
    export function clear(): boolean {
        sendPacket(0x33);
        let resp = receivePacket();
        return !!resp && resp[2] == 0x33;
    }

    function sendPacket(cmd: number, data?: number[]): void {
        let packet: number[] = [];
        packet.push(FRAME_HEAD);
        if (data && data.length > 0) {
            packet.push(data.length + 1);
            packet.push(cmd);
            packet = packet.concat(data);
        } else {
            packet.push(2);
            packet.push(cmd);
        }
        packet.push(FRAME_END);
        serial.writeBuffer(Buffer.fromArray(packet));
    }

    function receivePacket(timeout: number = 1000): number[] | undefined {
        let start = input.runningTime();
        let buf: number[] = [];
        while (input.runningTime() - start < timeout) {
            if (serial.readable()) {
                let b = serial.read();
                buf.push(b);
                if (buf.length > 2 && buf[0] == FRAME_HEAD && buf[buf.length - 1] == FRAME_END) {
                    return buf;
                }
            } else {
                basic.pause(1);
            }
        }
        return undefined;
    }
}