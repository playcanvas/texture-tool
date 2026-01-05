import { path } from 'playcanvas';

class Helpers {
    static removeExtension(filename: string): string {
        return filename.substring(0, filename.length - path.getExtension(filename).length);
    }
}

export {
    Helpers
};
