/*var http = require('http');

http.createServer(function (req, res) {
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('Hello, world!');
    
}).listen(process.env.PORT || 8080);*/
var http = require('http');
var Static = require('node-static');
var WebSocketServer = new require('ws');

var key = "JKjiu76%dfDrte356erjyt%iuyfiuyoliu&jk";
// подключенные клиенты
function Senddata() {
  this.key;
  this.id_client;
  this.ticker;
  this.request;
  this.source;
  this.type_data;
  this.data;
  this.tradetime;
  this.bid;
  this.ask;
  this.last;
}

var start_integral=false;

function Clients() {
	this.wsi={};
	this.integral_tickers=[];
}
var clients = {};


var webSocketServer = new WebSocketServer.Server({port: 8081});
webSocketServer.on('connection', function(ws) {
	var id_client = Math.random();
	clients[id_client] = new Clients();
  	clients[id_client].wsi = ws;
	console.log("новое соединение " + id_client);
	var senddata = new Senddata();
		senddata.key=key;
		senddata.id_client=id_client;
		senddata.request="connect";
	jp = JSON.stringify(senddata);
	try{
		clients[id_client].wsi.send(jp);
	}
	catch(err){console.log(err);}

	ws.on('message', function(message) {
		console.log('получено сообщение ' + message);
		jpp = JSON.parse(message);
		//---------------key------------------
		if (jpp['key']==key){
			//---integral----
			if (jpp['source']=="integral" && ( jpp['ticker']=="EUR/USD" || jpp['ticker']=="GBP/USD" || jpp['ticker']=="USD/JPY" || jpp['ticker']=="EUR/GBP" || jpp['ticker']=="USD/CHF" || jpp['ticker']=="EUR/JPY" || jpp['ticker']=="EUR/CHF" || jpp['ticker']=="USD/CAD" || jpp['ticker']=="AUD/USD" || jpp['ticker']=="GBP/JPY") ) {
				//realtime	
				if (jpp['type_data']=="realtime"){
					//запрос котировок
					if(jpp['request']=="reqdata"  ) {
						var est=false;
						var iu=0;
						for (var inte in clients[id_client].integral_tickers){
							if (clients[id_client].integral_tickers[inte]==jpp['ticker']) {
								est =true;
								break;
							}
							iu++;
							//console.log("a "+iu+" "+clients[id_client].integral_tickers+" "+jpp['ticker']);
						}
						if (!est) {
							clients[id_client].integral_tickers.push( jpp['ticker']) ;
							
							if (!start_integral) {
								start_integral=true;
								integral();
							}
						}	
					}
					//отмена котировок интеграла
					if(jpp['request']=="canceldata"){
						for(var keyt in clients[jpp['id_client']].integral_tickers){
							if (clients[jpp['id_client']].integral_tickers[keyt]==jpp['ticker']){
								//console.log("ffffffffffffffff "+clients[jpp['id_client']].integral_tickers[keyt]);
								clients[jpp['id_client']].integral_tickers.splice(keyt);
								break;
							}
						}
					}
				}
			}
		}
	});
  
	ws.on('close', function() {
		console.log('соединение закрыто ' + id_client);
		delete clients[id_client];
	});
});

console.log("Сервер запущен на порту 8081");



function integral(){
	if (start_integral){
		console.log("Start integral ");
		var olddata ={};
		var timerId = setInterval(function() {
			var integral_tickers=[];
			const https = require('http');
			for (var keyc in clients){
				integral_tickers = integral_tickers.concat(clients[keyc].integral_tickers).unique();
			}
			if (integral_tickers.length==0) {  //останавливаем если нет тикеров
				start_integral=false;
				clearInterval(timerId);
				console.log( 'стоп integral нет тикеров' );
			}
			var integral_list = integral_tickers.join(',');
			//console.log(integral_list);
			http.get("http://webrates.truefx.com/rates/connect.html?c="+integral_list+"&f=csv&s=n", (resp) => {
				let data = '';
				resp.on('data', (chunk) => {
					data += chunk;
				});
			
				resp.on('end', () => {
					var data1 = data.split('\n');
					for (var symb1 in data1) {
						
						//console.log(data1[symb1]);
						if (data1[symb1].length<7) continue;
						var data2 = data1[symb1].split(',');
						
						if (olddata[data2[0]]==data1[symb1]) continue;
						olddata[data2[0]]=data1[symb1];
						for (var keyc1 in clients) {
							//var estti =false;
							for (var sms in clients[keyc1].integral_tickers) {
								if (clients[keyc1].integral_tickers[sms]==data2[0]) {
									var senddata = new Senddata();
										senddata.key=key;
										senddata.id_client=keyc1;
										senddata.request="data";
										senddata.ticker=data2[0];
										senddata.tradetime=data2[1];
										senddata.bid=data2[2]+data2[3];
										senddata.ask=data2[4]+data2[5];
									jp2 = JSON.stringify(senddata);
									//console.log(clients[keyc1].integral_tickers[sms]+" "+ keyc1);
									try {
										clients[keyc1].wsi.send(jp2); 
									}
									catch(err){console.log(err);}
									break;
								}
							}
						}
					}
				});
			}).on("error", (err) => {
				console.log("Error: " + err.message);
			});
		}, 150);
	}
	else{
		clearInterval(timerId);
		console.log( 'стоп integral' );
	}
	// через 5 сек остановить повторы
	/*setTimeout(function() {
		clearInterval(timerId);
		console.log( 'стоп' );
	}, 3600000);*/
}

Array.prototype.unique = function() {
    var a = this.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
    }

    return a;
};





