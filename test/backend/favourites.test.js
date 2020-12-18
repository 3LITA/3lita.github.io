let server = require('../../src/back/server');
require('../../src/back/api/favourites');

let chai = require('chai')
let chaiHttp = require('chai-http')


chai.use(chaiHttp);

describe('Favourites API', () => {
    describe('GET /favourites', () => {
        it('should GET all favourite locations', async () => {
            let resp = await chai
                .request(server.app)
                .get('/favourites');

            chai.expect(resp.status).to.equal(200);
            chai.expect(resp.body).to.be.a('array');
            chai.expect(resp.body.length).to.be.equal(0);  // FIXME stub database
        });
    });

    describe('POST /favourites', () => {
        it('should POST new favourite location', async () => {
            let postResp = await chai
                .request(server.app)
                .post('/favourites')
                .send({name: 'London'});

            let getResp = await chai
                .request(server.app)
                .get('/favourites');

            chai.expect(postResp.status).to.equal(200);
            chai.expect(getResp.status).to.equal(200);
            chai.expect(getResp.body[0].name).to.be.equal('London');
        });

        it('should POST empty favourite location name and get 400', async () => {
            let resp = await chai
                .request(server.app)
                .post('/favourites')
                .send({});

            chai.expect(resp.status).to.equal(400);
            chai.expect(resp.text).to.equal("Please specify location name");
        });

        it('should POST not existing favourite location and get 404', async () => {
            let resp = await chai
                .request(server.app)
                .post('/favourites')
                .send({name: '1'});

            chai.expect(resp.status).to.equal(404);
            chai.expect(resp.text).to.equal("Location not found");
        })

        it('should POST duplicate favourite and get 500', async () => {
            await chai
                .request(server.app)
                .post('/favourites')
                .send({name: 'Berlin'});

            let resp = await chai
                .request(server.app)
                .post('/favourites')
                .send({name: 'Berlin'});

            chai.expect(resp.status).to.equal(500);
            chai.expect(resp.text).to.equal("Database error");
        });
    });

    describe('DELETE /favourites', () => {
        it('should DELETE favourite location', async () => {
            let postResp = await chai
                .request(server.app)
                .post('/favourites')
                .send({name: 'Paris'});

            let deleteResp = await chai
                .request(server.app)
                .delete('/favourites/Paris');

            let getResp = await chai
                .request(server.app)
                .get('/favourites');

            chai.expect(postResp.status).to.equal(200);
            chai.expect(deleteResp.status).to.equal(200);
            chai.expect(getResp.status).to.equal(200);
        });
    });

    afterEach((done) => {
        server.db.run("DELETE FROM favourites", () => {
            done();
        });
    });
});

