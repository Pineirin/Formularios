module.exports = {
    name: 'MiRouter',
    register: async (server, options) => {
        miserver = server;
        repositorio = server.methods.getRepositorio();
        server.route([
            //Borrar despues de preguntar a jordán
            {
                method: 'GET',
                path: '/base',
                handler: {
                    view: 'layout/base'
                }
            },
            {
                method: 'GET',
                path: '/registro',
                handler: async (req, h) => {
                    return h.view('registro',
                        {},
                        {layout: 'base'});
                }
            },
            {
                method: 'GET',
                path: '/login',
                handler: async (req, h) => {
                    return h.view('login',
                        {},
                        {layout: 'base'});
                }
            },
            {
                method: 'GET',
                path: '/desconectarse',
                handler: async (req, h) => {
                    req.cookieAuth.set({usuario: "", secreto: ""});
                    return h.view('login',
                        {},
                        {layout: 'base'});
                }
            },
            {
                method: 'POST',
                path: '/login',
                handler: async (req, h) => {
                    password = require('crypto').createHmac('sha256', 'secreto')
                        .update(req.payload.password).digest('hex');

                    usuarioBuscar = {
                        usuario: req.payload.usuario,
                        password: password,
                    };

                    // await no continuar hasta acabar esto
                    // Da valor a respuesta
                    await repositorio.conexion()
                        .then((db) => repositorio.obtenerUsuarios(db, usuarioBuscar))
                        .then((usuarios) => {
                            respuesta = "";
                            if (usuarios == null || usuarios.length == 0) {
                                respuesta = h.redirect('/login?mensaje="Usuario o password incorrecto"')
                            } else {
                                req.cookieAuth.set({
                                    usuario: usuarios[0].usuario,
                                    secreto: "secreto"
                                });
                                respuesta = h.redirect('/formularios/publicos')

                            }
                        });
                    return respuesta;
                }
            },
            {
                method: 'POST',
                path: '/registro',
                handler: async (req, h) => {
                    password = require('crypto').createHmac('sha256', 'secreto')
                        .update(req.payload.password).digest('hex');

                    usuario = {
                        usuario: req.payload.usuario,
                        password: password,
                    };

                    // await no continuar hasta acabar esto
                    // Da valor a respuesta
                    await repositorio.conexion()
                        .then((db) => repositorio.insertarUsuario(db, usuario))
                        .then((id) => {
                            respuesta = "";
                            if (id == null) {
                                respuesta = h.redirect('/registro?mensaje="Error al crear cuenta"')
                            } else {
                                respuesta = h.redirect('/login?mensaje="Usuario Creado"')
                                idAnuncio = id;
                            }
                        });

                    return respuesta;
                }
            },
            {
                method: 'GET',
                path: '/formularios/crear',
                options: {
                    auth: 'auth-registrado'
                },
                handler: async (req, h) => {
                    return h.view('formularios/crear',
                        {
                            usuarioAutenticado: req.state["session-id"].usuario,
                        },
                        {layout: 'base'});
                }
            },
            {
                method: 'POST',
                path: '/formularios/crear',
                options: {
                    auth: 'auth-registrado'
                },
                handler: async (req, h) => {
                    var preguntas = [];

                    // Buscamos preguntas según su tipo
                    for (let i = 2; i < Object.keys(req.payload).length; i++) {
                        var name = Object.keys(req.payload)[i];
                        var aux = req.payload[name];
                        var temp = {
                            valor: aux,
                            pos: i - 2,
                            required: true
                        };
                        if (name.startsWith('preguntaTexto')) {
                            temp.tipo = 'Texto';
                        }
                        if (name.startsWith('preguntaNumber')) {
                            temp.tipo = 'Numero';
                        }
                        if (name.startsWith('preguntaOpciones')) {
                            temp.valor = aux[0];
                            temp.opciones = aux.slice(1);
                            temp.tipo = 'Opciones';
                        }
                        preguntas.push(temp);
                    }

                    var formulario = {
                        usuario: req.state["session-id"].usuario,
                        titulo: req.payload.titulo,
                        descripcion: req.payload.descripcion,
                        preguntas,
                        public: true // De momento todas son publicas
                    };

                    await repositorio.conexion()
                        .then((db) => repositorio.insertarFormulario(db, formulario))
                        .then((id) => {
                            respuesta = "";
                            if (id == null) {
                                respuesta = h.redirect('/formularios/propios?mensaje="Error al crear el formulario"')
                            } else {
                                respuesta = h.redirect('/formularios/propios?mensaje="Formulario creado"');
                                idAnuncio = id;
                            }
                        });

                    return respuesta;
                }
            },
            {
                method: 'GET',
                path:
                    '/formularios/publicos',
                handler:
                    async (req, h) => {

                        var pg = parseInt(req.query.pg);
                        if (req.query.pg == null) {
                            pg = 1;
                        }

                        var criterio = {};
                        var listaFormularios = [];

                        criterio = {"public": true};

                        await repositorio.conexion()
                            .then((db) => repositorio.obtenerFormulariosPg(db, pg, criterio, 6))
                            .then((formularios, total) => {
                                listaFormularios = formularios;
                                pgUltima = listaFormularios.total / 6;

                                // La págian 2.5 no existe
                                // Si excede sumar 1 y quitar los decimales
                                if (pgUltima % 2 > 0) {
                                    pgUltima = Math.trunc(pgUltima);
                                    pgUltima = pgUltima + 1;
                                }
                            });

                        var paginas = [];
                        for (i = 1; i <= pgUltima; i++) {
                            if (i == pg) {
                                paginas.push({valor: i, clase: "uk-active"});
                            } else {
                                paginas.push({valor: i});
                            }
                        }

                        // Recorte
                        listaFormularios.forEach((e) => {
                            if (e.titulo.length > 40) {
                                e.titulo =
                                    e.titulo.substring(0, 40) + "...";
                            }
                            if (e.descripcion.length > 60) {
                                e.descripcion =
                                    e.descripcion.substring(0, 60) + "...";
                            }
                        });

                        return h.view('formularios/publicos',
                            {
                                usuarioAutenticado: req.state["session-id"].usuario,
                                formularios: listaFormularios,
                                paginas: paginas
                            }, {layout: 'base'});
                    }
            }
            ,
            {
                method: 'GET',
                path:
                    '/formularios/propios',
                options:
                    {
                        auth: 'auth-registrado'
                    }
                ,
                handler: async (req, h) => {

                    var pg = parseInt(req.query.pg);
                    if (req.query.pg == null) {
                        pg = 1;
                    }

                    var criterio = {"usuario": req.auth.credentials};
                    var listaFormularios = [];

                    await repositorio.conexion()
                        .then((db) => repositorio.obtenerFormulariosPg(db, pg, criterio, 4))
                        .then((formularios, total) => {
                            console.log(formularios.total);
                            listaFormularios = formularios;
                            pgUltima = listaFormularios.total / 4;

                            // La págian 2.5 no existe
                            // Si excede sumar 1 y quitar los decimales
                            if (pgUltima % 2 > 0) {
                                pgUltima = Math.trunc(pgUltima);
                                pgUltima = pgUltima + 1;
                            }

                        });

                    var paginas = [];
                    for (i = 1; i <= pgUltima; i++) {
                        if (i == pg) {
                            paginas.push({valor: i, clase: "uk-active"});
                        } else {
                            paginas.push({valor: i});
                        }
                    }
                    return h.view('formularios/propios',
                        {
                            formularios: listaFormularios,
                            usuarioAutenticado: req.state["session-id"].usuario,
                            paginas: paginas
                        },
                        {layout: 'base'});
                }
            }
            ,
            {
                method: 'GET',
                path:
                    '/formularios/{id}/eliminar',
                handler:
                    async (req, h) => {

                        var criterio = {
                            "_id": require("mongodb").ObjectID(req.params.id)
                        };

                        await repositorio.conexion()
                            .then((db) => repositorio.eliminarFormularios(db, criterio))
                            .then((resultado) => {
                                console.log("Eliminado")
                            });

                        return h.redirect('/formularios/propios?mensaje="Fomulario Eliminado"')
                    }
            }
            ,
            {
                method: 'GET',
                path:
                    '/formularios/{id}/responder',
                options:
                    {
                        auth: 'auth-registrado'
                    },
                handler: async (req, h) => {


                    var criterio = {"_id": require("mongodb").ObjectID(req.params.id)};
                    var formulario;

                    await repositorio.conexion()
                        .then((db) => repositorio.obtenerFormularios(db, criterio))
                        .then((formularios) => {
                            formulario = formularios[0];
                        });

                    return h.view('formularios/formulario',
                        {
                            id: require("mongodb").ObjectID(req.params.id),
                            formulario: formulario,
                            usuarioAutenticado: req.state["session-id"].usuario,
                        },
                        {layout: 'base'});
                }
            }
            ,
            {
                method: 'POST',
                path:
                    '/formularios/{id}/responder',
                options:
                    {
                        auth: 'auth-registrado'
                    }
                ,
                handler: async (req, h) => {

                    var criterio = {"_id": require("mongodb").ObjectID(req.params.id)};
                    var formulario;
                    var res = [];
                    var repetido = false;

                    await repositorio.conexion()
                        .then((db) => repositorio.obtenerFormularios(db, criterio))
                        .then((formularios) => {
                            formulario = formularios[0];
                        });
                    if(formulario) {
                        if (formulario.respuestas !== undefined) {
                            for (let i = 0; i< formulario.respuestas.length; i++) {
                                if (!formulario.respuestas[i].usuario.localeCompare(formulario.usuario)) {
                                    repetido = true;
                                }
                            }
                            if (repetido) {
                                return h.redirect('/formularios/publicos?mensaje="Respondido previamente"');
                            }
                        } else {
                            formulario.respuestas = [];
                        }

                        for (let i = 0; i < Object.keys(req.payload).length; i++) {
                            var name = Object.keys(req.payload)[i];
                            res[name] = req.payload[name]
                        }

                        formulario.respuestas.push({
                            usuario: req.state["session-id"].usuario,
                            res
                        });

                        await repositorio.conexion()
                            .then((db) => repositorio.modificarFormulario(db, criterio, formulario))
                            .then((id) => {
                                respuesta = "";
                                if (id == null) {
                                    respuesta = h.redirect('/formularios/' + req.params.id
                                        + '/responder?mensaje="Error al responder el formulario"');
                                } else {
                                    respuesta = h.redirect('/formularios/publicos?mensaje="Formulario respondido"');
                                }
                            });

                        return respuesta;
                    } else {
                        return h.redirect('/formularios/publicos?mensaje="Formulario no existe"');
                    }
                }
            }
            ,
            {
                method: 'GET',
                path:
                    '/formularios/{id}/modificar',
                options:
                    {
                        auth: 'auth-registrado'
                    },
                handler: async (req, h) => {


                    var criterio = {"_id": require("mongodb").ObjectID(req.params.id)};
                    var formulario;

                    await repositorio.conexion()
                        .then((db) => repositorio.obtenerFormularios(db, criterio))
                        .then((formularios) => {
                            formulario = formularios[0];
                        });

                    return h.view('formularios/modificar',
                        {
                            id: require("mongodb").ObjectID(req.params.id),
                            formulario: formulario,
                            usuarioAutenticado: req.state["session-id"].usuario,
                        },
                        {layout: 'base'});
                }
            }
            ,
            {
                method: 'POST',
                path: '/formularios/{id}/modificar',
                options: {
                    auth: 'auth-registrado'
                },
                handler: async (req, h) => {
                    var preguntas = [];
                    var criterio = {"_id": require("mongodb").ObjectID(req.params.id)};
                    var formulario;
                    var counter = 0;

                    await repositorio.conexion()
                        .then((db) => repositorio.obtenerFormularios(db, criterio))
                        .then((formularios) => {
                            formulario = formularios[0];
                        });

                    // Buscamos preguntas según su tipo
                    for (let i = 0; i < Object.keys(req.payload).length; i++) {

                        var name = Object.keys(req.payload)[i];
                        var aux = req.payload[name];

                        if (name == "titulo"){
                            formulario.titulo = aux;
                        }

                        if (name == "descripcion"){
                            formulario.descripcion = aux;
                        }

                        for (let i = 0; i < formulario.preguntas.length; i++) {
                            if (name == formulario.preguntas[i].pos){
                                formulario.preguntas[i].valor = aux
                                counter += 1;
                            }
                        }


                        var temp = {
                            valor: aux,
                            pos: i + counter,
                            required: true
                        };
                        if (name.startsWith('preguntaTexto')) {
                            temp.tipo = 'Texto';
                        }
                        if (name.startsWith('preguntaNumber')) {
                            temp.tipo = 'Numero';
                        }
                        if (name.startsWith('preguntaOpciones')) {
                            temp.valor = aux[0];
                            temp.opciones = aux.slice(1);
                            temp.tipo = 'Opciones';
                        }
                        formulario.preguntas.push(temp);
                    }

                    var criterio = {"_id": require("mongodb").ObjectID(req.params.id)};

                    await repositorio.conexion()
                        .then((db) => repositorio.modificarFormulario(db, criterio, formulario))
                        .then((id) => {
                            respuesta = "";
                            if (id == null) {
                                respuesta = h.redirect('/formularios/propios?mensaje="Error al modificar el formulario"')
                            } else {
                                respuesta = h.redirect('/formularios/propios?mensaje="Formulario modificar"');
                                idAnuncio = id;
                            }
                        });

                    return respuesta;
                }
            },
            {
                method: 'GET',
                path:
                    '/formularios/{id}/respuestas',
                options:
                    {
                        auth: 'auth-registrado'
                    },
                handler: async (req, h) => {


                    var criterio = {"_id": require("mongodb").ObjectID(req.params.id)};
                    var formulario;


                    await repositorio.conexion()
                        .then((db) => repositorio.obtenerFormularios(db, criterio))
                        .then((formularios) => {
                            formulario = formularios[0];
                        });

                    preguntas = [];
                    for (let i = 0; i < formulario.preguntas.length; i++) {
                        respuestas = formulario.respuestas[i];
                        pregunta = {
                            valor: formulario.preguntas[i].valor,
                            respuestas
                        };
                        preguntas.push(pregunta)
                    }

                    return h.view('formularios/respuestas',
                        {
                            titulo: formulario.titulo,
                            preguntas: preguntas,
                            usuarioAutenticado: req.state["session-id"].usuario,
                        },
                        {layout: 'base'});
                }
            }
            ,
            {
                method: 'GET',
                path:
                    '/{param*}',
                handler:
                    {
                        directory: {
                            path: './public'
                        }
                    }
            }
            ,
            {
                method: 'GET',
                path:
                    '/',
                handler:
                    async (req, h) => {
                        return h.redirect("/formularios/publicos")
                    }
            }
        ])
    }
};
