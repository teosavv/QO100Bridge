(function () {
    'use strict';
    const net = require('net');
    var SerialPort = require('serialport');
    const Readline = SerialPort.parsers.Readline;



    angular.module('QO100', [
        'ngRoute',
        'ui.bootstrap',
        'ngStorage'
    ]).controller('mainController', ['$scope', '$window','$http','$localStorage', function($scope, $window,$http,$localStorage){
        $scope.config={};
        $scope.config.omniconn = {ip : "127.0.0.1", port:"23", connected : false};
        $scope.omnistatec=[{text:"Connect", class:"btn-primary"},{text:"Connected", class:"btn-success"},{text:"Error", class:"btn-danger"}];
        $scope.pttstatec=[{class:"btn-secondary"},{class:"btn-success"},{class:"btn-danger"}];
        $scope.config.autostart=0;
        $scope.omnistate =0;
        $scope.sdrastate =0;
        $scope.comstate =0;
        $scope.pttstate =0;
        $scope.comports=[];
        if ($localStorage.config != undefined ){
            $scope.config = $localStorage.config;
        }
        $scope.$watch('config', function() {
            $localStorage.config =$scope.config;
            console.log("Config saved");
        },true);


        var socketClient;
        var freq = "";
        var freqtx="";

        


        SerialPort.list().then(ports => {
            ports.forEach((port) => {
              $scope.comports.push(port.path);
            });
            $scope.$apply();
        });

        $scope.pttcon = function(){
            if ($scope.config.comselected !=undefined){
                var sp = new SerialPort($scope.config.comselected, {
                    baudRate: 115200,
                });
                sp.on('open', function() {$scope.comstate=1;$scope.$apply();});
                sp.on('close', function() {$scope.comstate=0;$scope.pttstate=0;$scope.$apply();});
                sp.on('error', function() {$scope.comstate=2;$scope.pttstate=0;$scope.$apply();});
                const parser = sp.pipe(new Readline({ delimiter: '\r\n' }));
                parser.on('data', checkptt);
            }
        }

        function checkptt(event) {
            //console.log(event);
            if (event==0){
                $scope.pttstate=1;$scope.$apply();
            }else if (event==1){
                $scope.pttstate=2;$scope.$apply();
            }
        }
 
        $scope.sdraconnect= function(){        
            $scope.sdrastate=0;
            $http.get('http://127.0.0.1:8091/sdrangel',{header : {'Content-Type' : 'application/json; charset=UTF-8'}}).then(
                function successCallback(response) {
                    console.log(response);
                    $scope.sdrastate=1;
              }, function errorCallback(response) {
                    $scope.sdrastate=2;
              });
        };

        $scope.omnicon= function(){  
            socketClient = net.connect({host:$scope.config.omniconn.ip, port:$scope.config.omniconn.port},  () => {
                console.log('connected to server!');
                $scope.omnistate =1;
                $scope.$apply();
            });
        
            socketClient.on('error', (err) => {
                $scope.omnistate =2;
                $scope.$apply();
            });
    
            socketClient.on('data', (data) => {
            //console.log(data.toString());
            
            var command = data.toString('utf8');
                console.log(command);
            
            var trx=0; //0:RX 1:TX
            var mode = 4; //1: LSB 2: USB 3: CW 4: FM 5: AM 6: FSK (RTTY-LSB) 7: CW-R 8: PKT-L 9: FSK-R (RTTY-USB)
            var expcmd = command.split('');
            if (command == "FA;"){
                socketClient.write("FA"+freq+";");
            }
            else if (command == "FB;"){
                socketClient.write("FB"+freq+";");
            }else if(command == "FR;"){
                socketClient.write("FR0;");
            }
            else if(command == "FT;"){
                socketClient.write("FT0;");
            }
            else if(command == "PS;"){
                socketClient.write("PS0;");
            }
            else if(command == "TX;"){
                socketClient.write("TX0;");
            }
            else if(command == "SC;"){
                socketClient.write("SC0;");
            }
            else if(command == "SP;"){
                socketClient.write("SP0;");
            }
            else if(command == "TN;"){
                socketClient.write("TN01;");
            }
            else if(command == "MD;"){
                socketClient.write("MD"+mode+";");
            }
            else if(expcmd[0] == "M"&& expcmd[1] == "D"){
                mode=expcmd[2];
            }
            else if(command == "OS;"){
                socketClient.write("OS0;");
            }
            else if(expcmd[0] == "F"&& expcmd[1] == "A"){
                freq = expcmd[2]+expcmd[3]+expcmd[4]+expcmd[5]+expcmd[6]+expcmd[7]+expcmd[8]+expcmd[9]+expcmd[10]+expcmd[11]+expcmd[12]; 
                //socketClient.write("IF000"+freq+"+0000"+rx+""+tx+""+mode+"000;");
                freqtx = ""+ (parseInt(freq)-10489500+2400000);
                bc.postMessage(freqtx);
                for (var i=0;i<14-freqtx.length;i++) freqtx="0"+freqtx;
                socketClient.write("IF"+freq+"+000000000000 00"+trx+""+mode+"00000010;");
                console.log(freq);
                //setFreq(freq);
            }
            else if(command == "IF;"){
                socketClient.write("IF"+freq+"+000000000000 00"+trx+""+mode+"00000010;");
                //console.log("IF->"+freq);
            }
            else{
                socketClient.write(command);
                console.log(command);
            }
    
    
    
    
    
            });
            socketClient.on('end', () => {
                console.log('disconnected from server');
                $scope.omnistate =0;
                $scope.$apply();
            });
        };




        if ($scope.config.autostart){
            $scope.omnicon();
            $scope.sdraconnect();
            $scope.pttcon();
        }







    
    }]);

    
})();