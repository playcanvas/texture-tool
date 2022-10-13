// name: string
// type: boolean, number, string, enum, bytes, schema
// array: boolean
// default: any

class Schema {
    constructor(defs) {
        this.defs = defs;
        this.typeClasses = { };
    }

    instantiate(type) {
        let t = this.typeClasses[type];
        if (!t) {
            t = this.buildTypeClass(type);
            this.typeClasses[type] = t;
        }
        return new t();
    }

    buildTypeClass(type) {
        const prepareFuncs = {
            boolean: (raw) => {
                return !!raw;
            },
            number: (raw) => {
                switch (typeof raw) {
                    case 'number':
                        return raw;
                    case 'string': {
                        const v = parseInt(raw, 10);
                        return isNaN(v) ? null : v;
                    }
                    case 'boolean': {
                        return 0 + raw;
                    }
                    default:
                        return null;
                }
            },
            string: (raw) => {
                return '' + raw;
            },
            enum: (raw) => {
                // todo
                return null;
            },
            bytes: (raw) => {
                // todo
                return null;
            }
        };

        // get the schema structure
        const schema = this.defs[type];
        if (!schema) {
            return null;
        }

        const getFunc = () => {
            return function () {
                this.init();
            };
        };

        const typeClass = getFunc(type);
        typeClass.prototype.type = type;
        typeClass.prototype.schema = schema;

        const schemaSelf = this;

        // define initializer func
        typeClass.prototype.init = function () {
            this.storage = [];
            schema.forEach((schemaEntry, index) => {
                if (schemaEntry.array) {
                    // array
                    this.storage[index] = new ArrayWrapper();
                } else {
                    // value
                    const prepareFunc = prepareFuncs[schemaEntry.type];
                    const hasDefault = schemaEntry.hasOwnProperty('default');
                    switch (schemaEntry.type) {
                        case 'boolean': this.storage[index] = prepareFunc(hasDefault ? schemaEntry.default : false); break;
                        case 'number': this.storage[index] = prepareFunc(hasDefault ? schemaEntry.default : 0); break;
                        case 'string': this.storage[index] = prepareFunc(hasDefault ? schemaEntry.default : ''); break;
                        case 'enum': break;
                        case 'bytes': break;
                        default: this.storage[index] = schemaSelf.instantiate(schemaEntry.type); break;
                    }
                }
            });
        };

        // define get and set for a property on a type class
        const defineProperty = (typeClass, schemaEntry, index) => {
            const prepareFunc = prepareFuncs[schemaEntry.type];
            Object.defineProperty(typeClass.prototype, schemaEntry.name, {
                get: function () {
                    return this.storage[index];
                },
                set: function (raw) {
                    const value = prepareFunc(raw);
                    if (value !== null) {
                        if (value !== this.storage[index]) {
                            this.storage[index] = value;
                        }
                    } else {
                        // invalid set
                    }
                }
            });
        };

        const defineArrayProperty = (typeClass, schemaEntry, index) => {
            Object.defineProperty(typeClass.prototype, schemaEntry.name, {
                get: function () {
                    return this.storage[index];
                },
                set: function (raw) {

                }
            });
        };

        // define properties
        schema.forEach((schemaEntry, index) => {
            if (schemaEntry.array) {
                defineArrayProperty(typeClass, schemaEntry, index);
            } else {
                defineProperty(typeClass, schemaEntry, index);
            }
        });

        return typeClass;
    }
}

export {
    Schema
};
