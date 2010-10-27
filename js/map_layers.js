var gTiles = function()
{
    var getSlazavTileUrl = function (prefix, a,b)
    {
            if ( b == 7 && a.x >= 76 && a.x <= 78 && a.y >= 39 && a.y <= 40 )
            {
                return prefix + "Z" + b + "/" + a.y + "_" + a.x + ".png";
            }
            else if ( b == 8 && a.x >= 153 && a.x <= 156 && a.y >= 78 && a.y <= 81 )
            {
                return prefix + "Z" + b + "/" + a.y + "_" + a.x + ".png";
            }
            else if ( b == 9 && a.x >= 307 && a.x <= 312 && a.y >= 157 && a.y <= 163 )
            {
                return prefix + "Z" + b + "/" + a.y + "_" + a.x + ".png";
            }
            else if ( b == 10 && a.x >= 614 && a.x <= 625 && a.y >= 314 && a.y <= 326 )
            {
                return prefix + "Z" + b + "/" + a.y + "_" + a.x + ".png";
            }
            else if ( b == 11 && a.x >= 1228 && a.x <= 1251 && a.y >= 629 && a.y <= 652 )
            {
                return prefix + "Z" + b + "/" + a.y + "_" + a.x + ".png";
            }
            else if ( b == 12 && a.x >= 2457 && a.x <= 2503 && a.y >= 1258 && a.y <= 1305 )
            {
                return prefix + "Z" + b + "/" + a.y + "_" + a.x + ".png";
            }
            else if ( b == 13 && a.x >= 4915 && a.x <= 5006 && a.y >= 2516 && a.y <= 2610 )
            {
                return prefix + "Z" + b + "/" + a.y + "_" + a.x + ".png";
            }
            else if ( b == 14 && a.x >= 9830 && a.x <= 10013 && a.y >= 5033 && a.y <= 5221 )
            {
                return prefix + "Z" + b + "/" + a.y + "_" + a.x + ".png";   
            }
    };
    
    var getLocalArbaletTileUrl = function (prefix, a,b)
    {
            if ( b == 7 && a.x >= 76 && a.x <= 78 && a.y >= 39 && a.y <= 40 )
            {
                return prefix + "Z" + b + "/" + a.y + "_" + a.x + ".png";
            }
            else if ( b == 8 && a.x >= 152 && a.x <= 156 && a.y >= 78 && a.y <= 81 )
            {
                return prefix + "Z" + b + "/" + a.y + "_" + a.x + ".png";
            }
            else if ( b == 9 && a.x >= 305 && a.x <= 313 && a.y >= 156 && a.y <= 163 )
            {
                return prefix + "Z" + b + "/" + a.y + "_" + a.x + ".png";
            }
            else if ( b == 10 && a.x >= 611 && a.x <= 626 && a.y >= 313 && a.y <= 327 )
            {
                return prefix + "Z" + b + "/" + a.y + "_" + a.x + ".png";
            }
            else if ( b == 11 && a.x >= 1223 && a.x <= 1253 && a.y >= 627 && a.y <= 655 )
            {
                return prefix + "Z" + b + "/" + a.y + "_" + a.x + ".png";
            }
            else if ( b == 12 && a.x >= 2447 && a.x <= 2506 && a.y >= 1254 && a.y <= 1311 )
            {
                return prefix + "Z" + b + "/" + a.y + "_" + a.x + ".png";
            }
            else if ( b == 13 && a.x >= 4894 && a.x <= 5012 && a.y >= 2509 && a.y <= 2622 )
            {
                return prefix + "Z" + b + "/" + a.y + "_" + a.x + ".png";
            }
            else if ( b == 14 && a.x >= 9789 && a.x <= 10025 && a.y >= 5019 && a.y <= 5244 )
            {
                return prefix + "Z" + b + "/" + a.y + "_" + a.x + ".png";
            }
    };
    
    var isAvalibleOuterArbalet = function(a, b) 
    {
        if(b==0){
            if(a.y==0&&a.x==0)return true;
        }else if(b==1){
            if(a.y==0&&a.x==1)return true;
        }else if(b==2){
            if(a.y==1&&a.x==2)return true;
        }else if(b==3){
            if(a.y==2&&a.x==4)return true;
        }else if(b==4){
            if(4<=a.y&&a.y<=5&&a.x==9)return true;
        }else if(b==5){
            if(9<=a.y&&a.y<=10&&a.x==19)return true;
        }else if(b==6){
            if(19<=a.y&&a.y<=20&&38<=a.x&&a.x<=39)return true;
        }else if(b==7){
            if(39<=a.y&&a.y<=40&&76<=a.x&&a.x<=78)return true;
        }else if(b==8){
            if(a.y==78&&153<=a.x&&a.x<=155)return true;
        if(79<=a.y&&a.y<=80&&152<=a.x&&a.x<=156)return true;
            if(a.y==81&&154<=a.x&&a.x<=156)return true;
        }else if(b==9){
            if(a.y==156&&308<=a.x&&a.x<=310)return true;
            if(a.y==157&&307<=a.x&&a.x<=310)return true;
            if(a.y==158&&305<=a.x&&a.x<=311)return true;
            if(159<=a.y&&a.y<=160&&305<=a.x&&a.x<=313)return true;
            if(a.y==161&&306<=a.x&&a.x<=313)return true;
            if(a.y==162&&308<=a.x&&a.x<=312)return true;
            if(a.y==163&&309<=a.x&&a.x<=312)return true;
        }else if(b==10){
            if(313<=a.y&&a.y<=314&&616<=a.x&&a.x<=621)return true;
            if(a.y==315&&615<=a.x&&a.x<=621)return true;
            if(a.y==316&&612<=a.x&&a.x<=621)return true;
            if(a.y==317&&611<=a.x&&a.x<=622)return true;
            if(318<=a.y&&a.y<=320&&611<=a.x&&a.x<=626)return true;
            if(321<=a.y&&a.y<=323&&612<=a.x&&a.x<=626)return true;
            if(324<=a.y&&a.y<=325&&617<=a.x&&a.x<=624)return true;
            if(a.y==326&&619<=a.x&&a.x<=624)return true;
            if(a.y==327&&620<=a.x&&a.x<=623)return true;
        }else if(b==11){
            if(627<=a.y&&a.y<=629&&1233<=a.x&&a.x<=1242)return true;
            if(630<=a.y&&a.y<=631&&1230<=a.x&&a.x<=1242)return true;
            if(632<=a.y&&a.y<=634&&1225<=a.x&&a.x<=1242)return true;
            if(635<=a.y&&a.y<=636&&1223<=a.x&&a.x<=1244)return true;
            if(637<=a.y&&a.y<=639&&1223<=a.x&&a.x<=1252)return true;
            if(a.y==640&&1223<=a.x&&a.x<=1253)return true;
            if(641<=a.y&&a.y<=645&&1224<=a.x&&a.x<=1253)return true;
            if(a.y==646&&1224<=a.x&&a.x<=1252)return true;
            if(a.y==647&&1232<=a.x&&a.x<=1252)return true;
            if(648<=a.y&&a.y<=650&&1235<=a.x&&a.x<=1249)return true;
            if(651<=a.y&&a.y<=652&&1239<=a.x&&a.x<=1248)return true;
            if(653<=a.y&&a.y<=654&&1241<=a.x&&a.x<=1246)return true;
            if(a.y==655&&1241<=a.x&&a.x<=1244)return true;
        }else if(b==12){
            if(a.y==1254&&2467<=a.x&&a.x<=2484)return true;
            if(1255<=a.y&&a.y<=1259&&2467<=a.x&&a.x<=2485)return true;
            if(1260<=a.y&&a.y<=1264&&2461<=a.x&&a.x<=2485)return true;
            if(1265<=a.y&&a.y<=1269&&2450<=a.x&&a.x<=2485)return true;
            if(1270<=a.y&&a.y<=1274&&2447<=a.x&&a.x<=2488)return true;
            if(1275<=a.y&&a.y<=1279&&2447<=a.x&&a.x<=2505)return true;
            if(a.y==1280&&2447<=a.x&&a.x<=2506)return true;
            if(1281<=a.y&&a.y<=1290&&2448<=a.x&&a.x<=2506)return true;
            if(1291<=a.y&&a.y<=1292&&2448<=a.x&&a.x<=2505)return true;
            if(1293<=a.y&&a.y<=1295&&2465<=a.x&&a.x<=2505)return true;
            if(1296<=a.y&&a.y<=1300&&2470<=a.x&&a.x<=2498)return true;
            if(a.y==1301&&2473<=a.x&&a.x<=2496)return true;
            if(1302<=a.y&&a.y<=1304&&2479<=a.x&&a.x<=2496)return true;
            if(a.y==1305&&2482<=a.x&&a.x<=2496)return true;
            if(1306<=a.y&&a.y<=1307&&2482<=a.x&&a.x<=2492)return true;
            if(a.y==1308&&2483<=a.x&&a.x<=2492)return true;
            if(1309<=a.y&&a.y<=1310&&2483<=a.x&&a.x<=2488)return true;
            if(a.y==1311&&2487<=a.x&&a.x<=2488)return true;
        }else if(b==13){
            if(a.y==2509&&4935<=a.x&&a.x<=4969)return true;
            if(2510<=a.y&&a.y<=2519&&4935<=a.x&&a.x<=4971)return true;
            if(2520<=a.y&&a.y<=2529&&4923<=a.x&&a.x<=4971)return true;
            if(a.y==2530&&4905<=a.x&&a.x<=4971)return true;
            if(2531<=a.y&&a.y<=2536&&4900<=a.x&&a.x<=4971)return true;
            if(2537<=a.y&&a.y<=2539&&4901<=a.x&&a.x<=4971)return true;
            if(a.y==2540&&4901<=a.x&&a.x<=4977)return true;
            if(2541<=a.y&&a.y<=2549&&4895<=a.x&&a.x<=4977)return true;
            if(a.y==2550&&4895<=a.x&&a.x<=4984)return true;
            if(2551<=a.y&&a.y<=2552&&4894<=a.x&&a.x<=5011)return true;
            if(2553<=a.y&&a.y<=2560&&4895<=a.x&&a.x<=5011)return true;
            if(a.y==2561&&4895<=a.x&&a.x<=5012)return true;
            if(2562<=a.y&&a.y<=2565&&4896<=a.x&&a.x<=5012)return true;
            if(2566<=a.y&&a.y<=2581&&4897<=a.x&&a.x<=5012)return true;
            if(2582<=a.y&&a.y<=2585&&4897<=a.x&&a.x<=5011)return true;
            if(2586<=a.y&&a.y<=2590&&4931<=a.x&&a.x<=5011)return true;
            if(a.y==2591&&4940<=a.x&&a.x<=5011)return true;
            if(2592<=a.y&&a.y<=2600&&4940<=a.x&&a.x<=4997)return true;
            if(2601<=a.y&&a.y<=2603&&((4946<=a.x&&a.x<=4957)||(4959<=a.x&&a.x<=4992)))return true;
            if(2604<=a.y&&a.y<=2609&&4958<=a.x&&a.x<=4992)return true;
            if(a.y==2610&&4965<=a.x&&a.x<=4992)return true;
            if(2611<=a.y&&a.y<=2614&&4965<=a.x&&a.x<=4985)return true;
            if(2615<=a.y&&a.y<=2616&&4966<=a.x&&a.x<=4985)return true;
            if(2617<=a.y&&a.y<=2621&&4966<=a.x&&a.x<=4977)return true;
            if(a.y==2622&&4975<=a.x&&a.x<=4977)return true;
        }else return false;
    };
    
    // return {getSlazavTile:function(){}};
    return {
        getSlazavTile: function()
        {
            var prefixSlazav = 'http://parshin.tmweb.ru/maps/slazav/';
            var slazavLayer = new GTileLayer(new GCopyrightCollection('Slazav'), 7, 14, { isPng:true, opacity:1 });
            slazavLayer.getTileUrl = function (a, b) { return getSlazavTileUrl(prefixSlazav, a, b); };
            return slazavLayer;
        },
        getLocalArbaletTile: function()
        {
            var prefixLocalArbalet = 'http://parshin.tmweb.ru/maps/arbalet/';
            var localArbalerlayer = new GTileLayer(new GCopyrightCollection('Arbalet'), 7, 13, { isPng:true, opacity:1 });
            localArbalerlayer.getTileUrl = function (a, b) { return getSlazavTileUrl(prefixLocalArbalet, a, b); };
            return localArbalerlayer;
        },
        getOuterArbaletTile: function()
        {
            var prefixOuterArbalet = 'http://s3.amazonaws.com/arbalet/';
            var outerArbaletLayer = new GTileLayer(new GCopyrightCollection('Arbalet'), 0, 13, { isPng:true, opacity:1 });
            outerArbaletLayer.getTileUrl = function (a, b) { return isAvalible(a, b) ? prefixOuterArbalet+'z'+b+'/'+a.y+'_'+a.x+'.png' : ""};
            return outerArbaletLayer;
        }
    };
}();