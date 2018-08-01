var http = require('http');

var Static = require('node-static');
var WebSocketServer = new require('ws');

// подключенные клиенты
function Senddata() {
  this.id;
  this.request;
  this.data;
}

var clients = {};

var webSocketServer = new WebSocketServer.Server({port: 8080});
webSocketServer.on('connection', function(ws) {

  var id = Math.random();
  clients[id] = ws;
  //console.log("новое соединение " + id);
  var senddata = new Senddata();
	senddata.id=id;
	senddata.request="connect";
  jp = JSON.stringify(senddata);
  clients[id].send(jp);

  ws.on('message', function(message) {
    //console.log('получено сообщение ' + message);
	jpp = JSON.parse(message);
	jp1 = JSON.stringify({ id: id, kom: "receive", ms: message });
	clients[jpp['id']].send(jp1);
	
	tttt(jpp['id'],jpp['data']);
  });
  
  ws.on('close', function() {
    //console.log('соединение закрыто ' + id);
    delete clients[id];
  });

});

console.log("Сервер запущен на порту 8081");

function tttt(id1, message1){
	var senddata = new Senddata();
	senddata.id=id1;	
	senddata.data=message1;
	var timerId = setInterval(function() {
		const https = require('http');
		http.get("http://webrates.truefx.com/rates/connect.html?c="+message1+"&f=csv&s=n", (resp) => {
			let data = '';
			resp.on('data', (chunk) => {
				data += chunk;
			});
 
			resp.on('end', () => {
				jp2 = JSON.stringify({ id: id1, kom: "data", ms: data});
				/*for (var key in clients) {
					console.log(key);
				}*/
				
				if (!clients[id1]) clearInterval(timerId);
				else {
					try {
						clients[id1].send(jp2); 
					}
					catch(err){}
				}
			});
		}).on("error", (err) => {
			console.log("Error: " + err.message);
		});
	}, 250);
	
	// через 5 сек остановить повторы
	/*setTimeout(function() {
		clearInterval(timerId);
		console.log( 'стоп' );
	}, 3600000);*/
}
