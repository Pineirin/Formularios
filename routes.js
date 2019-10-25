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
                        { },
                        { layout: 'base'});
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
                                respuesta = h.redirect('/formularios_publicos')

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
                path: '/crear_formulario',
                options: {
                    auth: 'auth-registrado'
                },
                handler: async (req, h) => {
                    return h.view('crear_formulario',
                        {
                            usuarioAutenticado: req.state["session-id"].usuario,
                        },
                        {layout: 'base'});
                }
            },
            /*{
                method: 'POST',
                path: '/crear_formulario',
                options: {
                    auth: 'auth-registrado',
                    payload: {
                        output: 'stream'
                    }
                },
                handler: async (req, h) => {

                    descripcion = [];
                    arrayPreguntas = req.payload.preguntas.split("\n");
                    for (i = 0; i < arrayPreguntas; i++) {
                        descripcion.push(arrayPreguntas[i]);
                    }
                    formulario = {
                        usuario: req.state["session-id"].usuario,
                        titulo: req.payload.titulo,
                        descripcion: descripcion,

                    };

                    // await no continuar hasta acabar esto
                    // Da valor a respuesta

                    await repositorio.conexion()
                        .then((db) => repositorio.insertarFormulario(db, formulario))
                        .then((id) => {
                            respuesta = "";
                            if (id == null) {
                                respuesta = h.redirect('/?mensaje="Error al crear el formulario"')
                            } else {
                                respuesta = h.redirect('/?mensaje="Formulario creado"');
                                idAnuncio = id;
                            }
                        });

                    return respuesta;
                }
            },*/
            {
                method: 'GET',
                path: '/formularios_publicos',
                handler: async (req, h) => {

                    var criterio = {};
                    var listaFormularios = [];
                    if (req.query.criterio != null ){
                        criterio = { "titulo" : {$regex : ".*"+req.query.criterio+".*"}};
                    }
                    await repositorio.conexion()
                        .then((db) => repositorio.obtenerFormulariosPublicos(db, criterio))
                        .then((formularios) => {
                            listaFormularios = formularios;
                        });

                    // Recorte
                    listaFormularios.forEach( (e) => {
                        if (e.titulo.length > 25){
                            e.titulo =
                                e.titulo.substring(0, 25) + "...";
                        }
                        if (e.descripcion.length > 80) {
                            e.descripcion =
                                e.descripcion.substring(0, 80) + "...";
                        }
                    });

                    return h.view('formularios_publicos',
                        {
                            usuarioAutenticado: req.state["session-id"].usuario,
                            formularios: listaFormularios,
                        }, { layout: 'base'} );
                }
            },
            {
                method: 'GET',
                path: '/mis_formularios',
                options: {
                    auth: 'auth-registrado'
                },
                handler: async (req, h) => {

                    var listaFormularios = [];
                    var pg = parseInt(req.query.pg);
                    if ( req.query.pg == null){
                        pg = 1;
                    }

                    var criterio = { "usuario" : req.auth.credentials };

                    await repositorio.conexion()
                        .then((db) => repositorio.obtenerMisFormulariosPg(db, pg, criterio))
                        .then((formularios, total) => {
                            listaFormularios = formularios;
                            pgUltima = listaFormularios.total/5;

                            // La págian 2.5 no existe
                            // Si excede sumar 1 y quitar los decimales
                            if (pgUltima % 2 > 0 ){
                                pgUltima = Math.trunc(pgUltima);
                                pgUltima = pgUltima+1;
                            }

                        });

                    var paginas = [];
                    for( i=1; i <= pgUltima; i++){
                        if ( i == pg ){
                            paginas.push({valor: i , clase : "uk-active" });
                        } else {
                            paginas.push({valor: i});
                        }
                    }
                    return h.view('mis_formularios',
                        {
                            formularios: listaFormularios,
                            usuarioAutenticado: req.state["session-id"].usuario,
                            paginas : paginas
                        },
                        { layout: 'base'} );
                }
            },
            {
                method: 'GET',
                path: '/formularios/{id}/eliminar',
                handler: async (req, h) => {

                    var criterio = { "_id" :
                            require("mongodb").ObjectID(req.params.id) };

                    await repositorio.conexion()
                        .then((db) => repositorio.eliminarFormularios(db, criterio))
                        .then((resultado) => {
                            console.log("Eliminado")
                        });

                    return h.redirect('/mis_formularios?mensaje="Fomulario Eliminado"')
                }
            },
            {
                method: 'GET',
                path: '/{param*}',
                handler: {
                    directory: {
                        path: './public'
                    }
                }
            },
            {
                method: 'GET',
                path: '/',
                handler: async (req, h) => {
                    return h.view('index',
                        {
                            usuarioAutenticado: req.state["session-id"].usuario,
                        },
                        {layout: 'base'});
                }
            }
        ])
    }
};
