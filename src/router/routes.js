
const express = require("express")
const { Router } = express
const Container = require('../controllers/contenedorProd.js')
const usersList = require('../controllers/contenedorUsers')
const ruta = new Router()
//---------------------------------------------------//
// RUTAS REGISTRO
//---------------------------------------------------//

ruta.get('/register', (req, res) => {
    res.render('register')
})

ruta.post('/register', async (req, res) => {
    const { user, email, password } = req.body
    req.session.name = user

    console.log(email)
    const usuarios = await usersList.getUsers()
    const usuario = usuarios.find(usuario => usuario.email == email)
    if (usuario) {
        return res.render('register-error')
    }

    await usersList.saveUser({ user, email, password })
    res.redirect('/login')
})

//---------------------------------------------------//
// RUTAS LOGIN
//---------------------------------------------------//

ruta.get('/login', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/datos')
    }
    res.render('login')
})

ruta.post('/login', async (req, res) => {
    const { email, password } = req.body

    req.session.email = email
    
    const usuarios = await usersList.getUsers()
    const usuario = usuarios.find(
        usuario => usuario.email == email && usuario.password == password
    )
    if (!usuario) {
        console.log(usuarios)
        return res.render('login-error')
    }
    req.session.user = usuario.user
    res.redirect('/datos')
})

//---------------------------------------------------//
// RUTAS DATOS
//---------------------------------------------------//

async function requireAuthentication(req, res, next) {
    if (req.isAuthenticated()) {
        next()
    } else {
        res.redirect('/login')
    }
}

async function includeUserData(req, res, next) {
    if (req.session.email) {
        const usuarios = await usersList.getUsers()
        req.user = usuarios.find(usuario => usuario.email == req.session.email)
    }
    next()
}

ruta.get('/datos', requireAuthentication, includeUserData, async (req, res) => {
    const user = req.session.user
    console.log(user)
    const email = req.session.email
    const datos = { user, email }
    res.render('index', {datos})
})

//---------------------------------------------------//
// RUTAS LOGOUT
//---------------------------------------------------//

ruta.get('/logout', (req, res) => {
    req.logout(err => {
        res.redirect('/login')
    })
})

//---------------------------------------------------//
// RUTA INICIO
//---------------------------------------------------//

ruta.get('/', (req, res) => {
    res.redirect('/datos')
})

ruta.get('/delete/:id', async (req, res) => {
    const idDelete = req.params.id
    const deleteId = await Container.deleteById(idDelete)
    res.redirect('/datos')
})

module.exports = ruta