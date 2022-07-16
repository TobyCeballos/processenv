const express = require('express')
const { Server: HttpServer } = require('http')
const { Server: IOServer } = require('socket.io')
const app = express()
const httpServer = new HttpServer(app)
const io = new IOServer(httpServer)
const session = require('express-session')
const connectMongo = require('connect-mongo')
const cookieParser = require('cookie-parser')
const advancedOptions = {useNewUrlParser: true, useUnifiedTopology: true }
const MongoStorage = connectMongo.create({
    mongoUrl: 'mongodb+srv://tobyceballos:coderhouse@cluster0.erpbj.mongodb.net/Cluster0?retryWrites=true&w=majority',
    mongoOptions: advancedOptions,
    ttl: 600
})
const Contenedor = require('./src/controllers/contenedorMsg.js')
const Container = require('./src/controllers/contenedorProd.js')

const routes = require('./src/router/routes')


app.use(express.static('./src/public'))
app.set('view engine', 'ejs')
app.use(cookieParser())
app.use(
    session({
        store: MongoStorage,
        secret: 'shhhhhhhhhhhhhh',
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 60000 * 10
        },
    }));
app.use(express.json())
app.use(express.urlencoded({ extended: true}))
app.use((req, res, next) => {
    req.isAuthenticated = () => {
        if (req.session.email) {
            return true
        }
        return false
    }
    req.logout = done => {
        req.session.destroy(done)
    }
    next()
})
//---------------------------------------------------//
// Verificar Autenticacion
//---------------------------------------------------//
app.use((req, res, next) => {
    req.isAuthenticated = () => {
        if (req.session.email) {
            return true
        }
        return false
    }
    req.logout = done => {
        req.session.destroy(done)
    }
    next()
})

app.use("/", routes)

io.on('connection', async (sockets) => {
    sockets.emit('product', await Container.getProds())
    console.log('Un cliente se ha conectado!: ' + sockets.id)
    // div
    sockets.emit('messages', await Contenedor.getMsg())

    sockets.on('new-product', async data => {
        const name = data.name
        const description = data.description
        const price = data.price
        const stock = data.stock
        const thumbnail = data.thumbnail
        await Container.saveProd({name, description, price, stock, thumbnail})
        io.sockets.emit('product', await Container.getProds())
    })
    sockets.on('new-message', async dato => {
        console.log(dato)
        const email = dato.email
        const text = dato.text
        const fecha = dato.fecha
        const hora = dato.hora

        await Contenedor.saveMsj(email, text, fecha, hora)

        io.sockets.emit('messages', await Contenedor.getMsg())
    })
})





const PORT = process.env.PORT || 8080
httpServer.listen(PORT, () => console.log('Iniciando en el puerto: ' + PORT))