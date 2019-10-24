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
                                respuesta = h.redirect('/')

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
                        {usuario: 'jordán'},
                        {layout: 'base'});
                }
            },
            {
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
                        usuario: req.auth.credentials,
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
            },
            {
                method: 'GET',
                path: '/forms/public',
                handler: async (req, res) => {
                    let public_forms;
                    await repositorio.conexion()
                        .then((db) => repositorio.getPublicForms(db, {is_public: true}))
                        .then((forms) => {
                            if(forms){
                                public_forms = forms;
                            } else {
                                public_forms = [];
                            }
                        });
                    return res.view('forms',
                        {forms: public_forms},
                        {layout: 'base'});
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
                        {usuario: 'jordán'},
                        {layout: 'base'});
                }
            }
        ])
    }
};
