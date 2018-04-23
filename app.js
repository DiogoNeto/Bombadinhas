var express = require('express');
var app = express();
var serv = require('http').Server(app);

//index client 
app.get('/',function(req, res) {
    res.sendFile(__dirname + '/client/index2.html');
});

//here are the files to use
app.use('/client',express.static(__dirname + '/client'));

'use strict';

var port = process.env.PORT || 9999;

serv.listen(port);
console.log("Server started.");
 
//number of players permitted
var maxPlayersNumber = 4;
var playersNumber = 2; 
var winner = false;
var acl2= true;
var aclx;
var acly;

var SOCKET_LIST = {};

//blocos
var block = [['40','80','40','80'], ['80','120','40','80'], ['120','160','40','80'], ['440','480','340','380'], ['440','480','280','320'], ['440','480','320','360'], ['400','440','140','180'], ['400','440','180','220'], ['40','80','40','80'], ['80','120','40','80'], ['120','160','40','80'], ['640','680','40','80'], ['680','720','40','80'], ['720','760','40','80'], ['40','80','340','380'], ['40','80','280','320'], ['40','80','320','360']];
 
var Entity = function(){
    var self = {
        x:0,
        y:0,
        spdX:0,
        spdY:0,
        id:"",
        live:true,
        bombs:4,
    }
    self.update = function(){
    	if(self.live===true)
        self.updatePosition();
    }
    self.updatePosition = function(){
        self.x += self.spdX;
        self.y += self.spdY;

         //player collision;
        for(var i in Player.list){
            var p = Player.list[i];
            if(p.x<20 && p.y>40 && p.y<60){
            	p.x=760;
            	p.y=420;
            }

             if(p.x>730 && p.y>40 && p.y<60){
            	p.x=0;
            	p.y=420;
            }
        }
    }
    self.getDistance = function(pt){
        return Math.sqrt(Math.pow(self.x-pt.x,2) + Math.pow(self.y-pt.y,2));
    }
    return self;
}
 

var Player = function(id){
    var self = Entity();
    self.id = id;
    self.number = "#";
    //Start Positions
    switch(playersNumber){
    	case 0:
    	self.x=100;
    	self.y=100;
    	break;
    	case 1:
    	self.x=200;
    	self.y=400;
    	break
    	case 2:
    	self.x=700;
    	self.y=100;
    	break;
    	case 3:
    	self.x=700;
    	self.y=400;
    	break;
    }
    
    self.pressingRight = false;
    self.pressingLeft = false;
    self.pressingUp = false;
    self.pressingDown = false;
    self.pressingAttack = false;
    self.maxSpd = 3 ;
   
    var super_update = self.update;
    self.update = function(){
        self.updateSpd();
        super_update();

        if(self.x>(aclx-30) && self.x<(aclx+30) && self.y>(acly-30) && self.y<(acly+30)){
            aclx=Math.floor(Math.random()*600);
            acly=Math.floor(Math.random()*300);
            self.maxSpd=self.maxSpd+1;
        }


       	
        if(self.pressingAttack){
        		self.shootBomb(0);
	    		self.shootBomb(90);
	    		self.shootBomb(180);
	    		self.shootBomb(270);		
        }
    }

    //player attack
    self.shootBomb = function(angle){
    	if(self.live===true && self.bombs > 0){
        	var b = Bomb(self.id,angle);
        	b.x = self.x;
        	b.y = self.y;
        	self.bombs --;
        	console.log(self.id + " bombs: " + self.bombs);
    	}
    }
   
   
    self.updateSpd = function(){
        if(self.pressingRight && self.x < 760 && self.interceptRight()===false){
            self.spdX = self.maxSpd;
        }
        else if(self.pressingLeft && self.x > 5 && self.interceptLeft()===false){
            self.spdX = -self.maxSpd;
        }
        else{
            self.spdX = 0;
        }
        if(self.pressingUp && self.y > 25 && self.interceptUp()===false){
            self.spdY = -self.maxSpd;
        }
        else if(self.pressingDown && self.y < 430 && self.interceptDown()===false){
            self.spdY = self.maxSpd;
        }
        else{
            self.spdY = 0;     
        }
    }

    
    
    self.interceptRight = function(){
    	var i = 0;
    	while(i < block.length){
    		if((self.x > block[i][0]-40) && (self.x < block[i][0]) && (self.y > block[i][2]) && (self.y < block[i][3])){
    			return true;
    		}
    		i++;
    	}
    	return false;
    }

    self.interceptLeft = function(){
    	var i = 0;
    	while(i < block.length){
    		if((self.x > block[i][0]) && (self.x < block[i][1]) && (self.y > block[i][2]) && (self.y < block[i][3])){
    			return true;
    		}
    		i++;
    	}
    	return false;
    }
    
    self.interceptUp = function(){
    	var i = 0;
    	while(i < block.length){
    		if((self.y > block[i][2]) && (self.y < block[i][3]) && (self.x > block[i][0] - 30) && (self.x < block[i][1])){
    			return true;
    		}
    		i++;
    	}
    	return false;
    }

    self.interceptDown = function(){
    	var i = 0;
    	while(i < block.length){
    		if((self.y > block[i][2] - 20) && (self.y < block[i][3]) && (self.x > block[i][0] - 30) && (self.x < block[i][1])){
    			return true;
    		}
    		i++;
    	}
    	return false;
    }
    Player.list[id] = self;
    return self;
}


Player.list = {};
Player.onConnect = function(socket){
	
    var player = Player(socket.id);
    var j = 0;

    aclx=200;
    acly=200;



    //count players
    for(var i in Player.list){
    		j++;
            var p = Player.list[i];
            p.number = j;
            console.log("Player: | " + j);
            //allows a maximum of four players
            if(j>maxPlayersNumber){
            	j--;
            	delete Player.list[socket.id];
            }

            if(j!==1){
            	playersNumber=j;
            }
        }

    socket.on('keyPress',function(data){
        if(data.inputId === 'left')
            player.pressingLeft = data.state;
        else if(data.inputId === 'right')
            player.pressingRight = data.state;
        else if(data.inputId === 'up')
            player.pressingUp = data.state;
        else if(data.inputId === 'down')
            player.pressingDown = data.state;
        else if(data.inputId === 'attack'){
            player.pressingAttack = data.state;	
        }      
    });
}

Player.onDisconnect = function(socket){
	playersNumber --;
    delete Player.list[socket.id];
}
Player.update = function(){
    var pack = [];
    for(var i in Player.list){
        var player = Player.list[i];
        player.update();
        pack.push({
            x:player.x,
            y:player.y,
        });    
    }
    return pack;
}
 
 
var Bomb = function(parent,angle){
    var self = Entity();
    self.id = Math.random();
    self.parent = parent;
    self.timer = 0;
    self.toRemove = false;
    var super_update = self.update;
    
    self.update = function(){

	if(self.timer++ > 50){
	    	self.spdX = Math.cos(angle/180*Math.PI) * 10;
	    	self.spdY = Math.sin(angle/180*Math.PI) * 10;
	    }        
	if(self.timer++ > 200){
            var p = Player.list[i];
            self.toRemove = true;
            for(var i in Player.list){
            	var p = Player.list[i];
            	p.bombs = 12;
        	}
        }
        super_update();

        //player collision;
        for(var i in Player.list){
            var p = Player.list[i];
            //if(self.getDista>(p) < 30 && >f.parent !== p.id){   
            //player die             
            if(self.getDistance(p) < 30 && self.timer>50){                
                p.x = -100;
                p.y = -100;
                p.live = false;
                self.toRemove = true;
                //the number of players decrease
                playersNumber --;

                console.log(playersNumber);

                if(playersNumber==1){
                	for(var i in Player.list){
                		var p = Player.list[i];
                	if(p.live===true){
                		//alert("Player" + i + " wins!");
                		console.log( p.number + " wins!");	
                		var winner = true;

                		}
                	}
            	}
        	}
		}

        //block collision
        for(var i=0; i<block.length; i++){
        	var b = block[i][1];
        	//console.log('Bomb:' +i+ ":" + b + 'Self:' + self.x);
        	if(self.x > block[i][0] && self.x < block[i][1] && self.y > block[i][2] && self.y < block[i][3] ){
        		self.toRemove = true;
        		p.bombs=12;
        	}
        }
        if(self.timer==100){
            aclx=Math.floor(Math.random()*600);
            acly=Math.floor(Math.random()*300);
        }    
    }
    Bomb.list[self.id] = self;
    return self;
}

Bomb.list = {};

//update bombs position 
Bomb.update = function(){
    var pack = [];
    for(var i in Bomb.list){
        var bomb = Bomb.list[i];
        bomb.update();
        if(bomb.toRemove)
            delete Bomb.list[i];
        else
            pack.push({
                x:bomb.x,
                y:bomb.y,
            });    
    }
    return pack;
}


var DEBUG = true;
 
var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
    socket.id = Math.random();
    SOCKET_LIST[socket.id] = socket;
    console.log('new player.');
    //socket.emit('addToChat','new player');

    Player.onConnect(socket);
   
    socket.on('disconnect',function(){
        delete SOCKET_LIST[socket.id];
        Player.onDisconnect(socket);
        console.log('player logged out.');
        socket.emit('addToChat','player logged out.');
    });
    socket.on('sendMsgToServer',function(data){
        var playerName = ("p.id" + socket.id).slice(2,7);
        for(var i in SOCKET_LIST){
            SOCKET_LIST[i].emit('addToChat',playerName + ': ' + data);
        }
    });
   
    socket.on('evalServer',function(data){
        if(!DEBUG)
            return;
        var res = eval(data);
        socket.emit('evalAnswer',res);     
    });   
});
 
//update game 30 frames per second
setInterval(function(){
    var pack = {
        player:Player.update(),
        bomb:Bomb.update(),
    } 
    for(var i in SOCKET_LIST){
        var socket = SOCKET_LIST[i];
        socket.emit('newPositions',pack);
        if(acl2===true)
        socket.emit('ApplePos', { x: aclx, y: acly });
     	if(playersNumber<2)
     	socket.emit('GameOver', { gameover: 'gameover' });	
    }
},1000/30);

