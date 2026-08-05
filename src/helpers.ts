import { path } from 'playcanvas';

const removeExtension = (filename: string) =>
    filename.substring(0, filename.length - path.getExtension(filename).length);

export { removeExtension };
