const { Pool } = require('pg');
const format = require('pg-format');

const pool = new Pool({
    host: 'localhost',
    user: 'postgres',
    password: '2833',
    database: 'joyas',
    allowExitOnIdle: true
})

const getJoyas = async ({ limits = 3, order_by = "id_ASC", page = 1 }) => {
    try {
        if (page >= 1) {
            const [field, direction] = order_by.split("_");
            const offset = (page - 1) * limits;
            const query = format("SELECT * FROM inventario ORDER BY %s %s LIMIT %s OFFSET %s", field, direction, limits, offset);
            const result = await pool.query(query);
            return result.rows;
        } else {
            console.log("No hay resultados");
        }
    } catch (error) {
        console.log(error.message);
    }
}

const joyasHATEOAS = (joyas) => {
    try {
        const results = joyas.map((m) => {
            return {
                id: m.id,
                name: m.nombre,
                href: `/joyas/joya/${m.id}`,
            }
        }).slice(0, 6)
        const total = joyas.length;
        const stockTotal = joyas.reduce((total, producto) => total + producto.stock, 0);
        const HATEOAS = {
            total,
            stockTotal,
            results
        }
        return HATEOAS;
    } catch (error) {
        console.log(error.message);
    }
}

const getJoyasByFilter = async ({ precio_max, precio_min, categoria, metal }) => {
    try {
        let filter = [];
        const values = [];

        const addFilter = (field, comparator, value) => {
            values.push(value)
            const { length } = filter;
            filter.push(`${field} ${comparator} $${length + 1}`);
        };

        if (precio_max) {
            addFilter('precio', '<=', precio_max);
        }
        if (precio_min) {
            addFilter('precio', '>=', precio_min);
        }
        if (categoria) {
            addFilter('categoria', '=', categoria);
        }
        if (metal) {
            addFilter('metal', '=', metal);
        }

        let query = "SELECT * FROM inventario";

        if (filter.length > 0) {
            filter = filter.join(' AND ');
            query += ` WHERE ${filter}`;
        }

        const results = await pool.query(query, values);
        return results.rows;
    } catch (error) {
        console.log(error.message);
    }
}

const reportMiddleware = (req, res, next) => {
    const url = req.url;
    const method = req.method;
    console.log(`Hoy ${new Date()} 
        se ha recibido una consulta en la ruta ${url} con el metodo ${method}`);
    if (Object.keys(req.query).length > 0) console.log('req.query: ', JSON.stringify(req.query, null, 2));
    next();
};

module.exports = {
    getJoyas,
    joyasHATEOAS,
    getJoyasByFilter,
    reportMiddleware
}