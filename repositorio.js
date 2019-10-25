module.exports = {
    conexion: async () => {
        var mongo = require("mongodb");
         /*var db = "mongodb://admin:informatica1234@cluster0-shard-00-00-wykof.mongodb.net:27017,cluster0-shard-" +
            "00-01-wykof.mongodb.net:27017,cluster0-shard-00-02-wykof.mongodb.net:27017/test?ssl=true&replicaSet=" +
            "Cluster0-shard-0&authSource=admin&retryWrites=true&w=majority"; // Piñe */
         var db = "mongodb://admin:informatica1234@cluster0-shard-00-00-rimdf.mongodb.net:27017,cluster0-shard-" +
            "00-01-rimdf.mongodb.net:27017,cluster0-shard-00-02-rimdf.mongodb.net:27017/test?ssl=true&replicaSet=" +
            "Cluster0-shard-0&authSource=admin&retryWrites=true&w=majority"; // David
        promise = new Promise((resolve, reject) => {
            mongo.MongoClient.connect(db, (err, db) => {
                if (err) {
                    resolve(null)
                } else {
                    resolve(db);
                }
            });
        });
        return promise;
    },
    obtenerFormulariosPublicos: async (db, criterio) => {
        promise = new Promise((resolve, reject) => {
            var collection = db.collection('formularios');
            collection.find(criterio).toArray( (err, result) => {
                if (err) {
                    resolve(null);
                } else {
                    resolve(result);
                }
                db.close();
            });
        });

        return promise;
    },
    obtenerUsuarios: async (db, criterio) => {
        promise = new Promise((resolve, reject) => {
            var collection = db.collection('usuarios');
            collection.find(criterio).toArray((err, result) => {
                if (err) {
                    resolve(null);
                } else {
                    // lista de anuncios
                    resolve(result);
                }
                db.close();
            });
        });

        return promise;
    },
    insertarUsuario: async (db, usuario) => {

        promise = new Promise((resolve, reject) => {
            var collection = db.collection('usuarios');
            collection.insert(usuario, (err, result) => {
                if (err) {
                    resolve(null);
                } else {
                    // _id no es un string es un ObjectID
                    resolve(result.ops[0]._id.toString());
                }
                db.close();
            });
        });

        return promise;
    },
    insertarFormulario: async (db, formulario) => {

        promise = new Promise((resolve, reject) => {
            var collection = db.collection('formularios');
            collection.insert(formulario, (err, result) => {
                if (err) {
                    resolve(null);
                } else {
                    // _id no es un string es un ObjectID
                    resolve(result.ops[0]._id.toString());
                }
                db.close();
            });
        });

        return promise;
    },
    obtenerFormulariosPg : async (db, pg, criterio) => {
        promise = new Promise((resolve, reject) => {
            var collection = db.collection('formularios');
            collection.count( criterio, (err, count) => {
                collection.find(criterio).skip( (pg-1)*5 ).limit( 5 )
                    .toArray( (err, result) => {

                        if (err) {
                            resolve(null);
                        } else {
                            result.total = count;
                            resolve(result);
                        }
                        db.close();
                    });
            })
        });

        return promise;
    },
    eliminarFormularios : async (db, criterio) => {
        promise = new Promise((resolve, reject) => {
            var collection = db.collection('anuncios');
            collection.remove(criterio, (err, result) => {
                if (err) {
                    resolve(null);
                } else {
                    resolve(result);
                }
                db.close();
            });
        });

        return promise;
    },
};
