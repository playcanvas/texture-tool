
import { Schema } from './schema.js';

const schemaTest = () => {

    const SchemaDefs = {
        Vec3: [{
            name: 'x',
            type: 'number'
        }, {
            name: 'y',
            type: 'number'
        }, {
            name: 'z',
            type: 'number'
        }],

        RenderState: [{
            name: 'alphaTest',
            type: 'number'
        }, {
            name: 'blendMode',
            type: 'string',
            enum: ['none', 'normal']
        }, {
            name: 'depthTest',
            type: 'boolean'
        }],

        Material: [{
            name: 'name',
            type: 'string'
        }, {
            name: 'description',
            type: 'string'
        }, {
            name: 'renderState',
            type: 'RenderState',
        }, {
            name: 'color',
            type: 'Vec3'
        }]
    };

    const schema = new Schema(SchemaDefs);
    const avec3 = schema.instantiate('Vec3');
    const amaterial = schema.instantiate('Material');

    amaterial.description = 'my description';
    amaterial.renderState.depthTest = 'hello';

    console.log(avec3);
    console.log(amaterial);
}

export {
    schemaTest
};
