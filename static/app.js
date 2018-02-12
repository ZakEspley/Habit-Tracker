$(document).ready(function(){

    PIXI.utils.sayHello();

    let type = "WebGL"
    if (!PIXI.utils.isWebGLSupported()) {
        type = 'canvas'
    }

    let app = new PIXI.Application({
        width: 512,
        height: 512,
        antialias: true,
        transparent: false,
        resolution: 1
    });

    //Place Origin in Bottom Right
    app.stage.position.y = app.renderer.height;
    app.stage.scale.y = -1;
    // var container = document.querySelector(".container").getBoundingClientRect()
    // var stageWidth =  window.innerWidth;
    var stageWidth = $(".container").width();
    var stageHeight = 512;
    app.renderer.backgroundColor = 0x38c9ff;
    app.renderer.view.style.display = "block";
    app.renderer.autoResize = true;
    app.renderer.resize(stageWidth, stageHeight);
    var play = false;

    window.addEventListener("resize", function (e) {
        console.log($(".container").width());
        var stageWidth = $(".container").width();
        // stageWidth =  window.innerWidth;
        // stageHeight = 512;
        app.renderer.resize(stageWidth, stageHeight);
        //Place Origin in Bottom Right
        app.stage.position.y = app.renderer.height;
        app.stage.scale.y = -1;
        mb.x = 0.33*app.stage.width;
        mt.x = 0.66*stageWidth;
        mt.width = 0.25*stageWidth;
        mb.width = 0.25*stageWidth;
    })

    function updateSimulation(event, ui) {
        lambda = lambdaSlide.slider('value');
        kappa = kappaSlide.slider('value');
        mt.sand.height = lambda*mt.border.height;
        mb.sand.height = (1-lambda)*mb.border.height;
        mt.sand.alpha = (1/kMax**j)*kappa**j
        mb.sand.alpha = (1/kMax**j)*kappa**j
        mt.mg_vec.height = mw*g*kappa*lambda;
        mb.mg_vec.height = mw*g*kappa*(1-lambda);
        at = (1/(lambda*kappa) - 1)*g;
        ab = (1/((1-lambda)*kappa)-1)*g;
        lamVal.val(lambda);
        kapVal.val(kappa);

    }

    
    var lamVal = $('#lamVal');
    var kapVal = $("#kapVal");
    var lambdaSlide = $("#lambda");

    lambdaSlide = lambdaSlide.slider({
        orientation: "horizontal",
        max: 1,
        min: 0,
        step: 0.01,
        value: 0.5,
        slide: updateSimulation,
        change: updateSimulation
    }
    )

    var kappaSlide = $("#kappa")
    kappaSlide.slider({
        orientation: 'horizontal',
        min: 0,
        max: 3,
        step: 0.1,
        value: 2,
        slide: updateSimulation,
        change: updateSimulation
    })


    var lambda = lambdaSlide.slider('value');
    var kappa = kappaSlide.slider('value');
    var mbp = 1 - lambda;
    var mtp = lambda;
    var mw = 8;
    var g = 10;
    var at = (1/(lambda*kappa) - 1)*g;
    var ab = (1/((1-lambda)*kappa)-1)*g;
    lamVal.val(lambda);
    kapVal.val(kappa);


    var mt = new Can("mt", 0.66 * stageWidth, 0.5 * stageHeight, 0.25 * stageWidth, 0.25 * stageHeight,
        0xe7990a, mtp, mw, g, kappa);
    var mb = new Can("mb", 0.33 * app.renderer.width, 0.5 * stageHeight, 0.25 * stageWidth, 0.25 * stageHeight,
        0xe7990a, mbp, mw, g, kappa);

    var kMax = kappaSlide.slider('option',"max");
    var j = 0.3;
    // mt.sand.alpha = (1/Math.PI * Math.asin(2/kMax*kappa-1)+1/2);
    // mb.sand.alpha = (1/Math.PI * Math.asin(2/kMax*kappa-1)+1/2);
    mt.sand.aplha = (1/kMax**j)*kappa**j;
    mb.sand.aplha = (1/kMax**j)*kappa**j;

    var playTexture = PIXI.Texture.fromImage('/static/play.svg');
    var pauseTexture = PIXI.Texture.fromImage('/static/pause.svg')

    function runSim() {
        if (play){
            controlButton.setTexture(playTexture);
        } else {
            controlButton.setTexture(pauseTexture);
        }
        play = !play;
    }

    function reset() {
        time = 0;
        mb.y = mb.y0;
        mt.y = mt.y0;
    }

    var controlButton = new PIXI.Sprite(playTexture);

    controlButton.interactive = true;
    controlButton.buttonMode = true;
    controlButton.x=20;
    controlButton.y=20;
    controlButton.on('pointerdown', runSim);

    resetButton = new PIXI.Sprite.fromImage("/static/refresh-ccw.svg");
    resetButton.interactive = true;
    resetButton.buttonMode = true;
    resetButton.x = 60;
    resetButton.y = 20;
    resetButton.on("pointerdown", reset);

    app.stage.addChild(mt);
    app.stage.addChild(mb);
    app.stage.addChild(controlButton);
    app.stage.addChild(resetButton);
    document.getElementById('display').appendChild(app.view);
    var timescale = 0.05;
    var time = 0;
    app.ticker.add(delta => gameloop(delta));

    function gameloop(delta) {
        
        if (play) {
            time += delta*timescale;
            mt.y = mt.y0 + 1/2*at*(time)**2;
            mb.y = mb.y0 + 1/2*ab*time**2;
        }
    }
    

    
});


class Arrow extends PIXI.Container {
    constructor(x0,y0,dx,dy, color, lw=1) {
        super();
        this.arrow = new PIXI.Graphics();
        this.x = x0 - lw;
        this.y = y0;
        this.x0 = this.x;
        this.y0 = this.y;
        this.xc = x0;
        this.yc = 0;
        this.arrow.beginFill(color);
        this.arrow.moveTo(lw,0);
        this.arrow.lineStyle(lw, color);
        this.arrow.lineTo(lw+dx, 0.9*dy);
        this.arrow.drawPolygon([dx,0.9*dy,dx+2*lw,0.9*dy,lw+dx,dy,dx,0.9*dy])
        this.addChild(this.arrow);
    }
}

class Can extends PIXI.Container {
    constructor(name, x, y, width, height, color, percent = 1, mw=1, g=1, kappa=1) {
        super();

        this.sand = new PIXI.Graphics();
        this.border = new PIXI.Graphics();
        this.name = new PIXI.Sprite.fromImage("/static/" + name + ".png");
        this.origin = new PIXI.Graphics();
        this.x = x - width/2;
        this.y = y - height/2;
        this.x0 = this.x;
        this.y0 = this.y;
        this.xc = x;
        this.yc = y;
        this.height = height;
        this.width = width;
        
        this.sand.beginFill(color);
        this.sand.drawRect(0, 0, width, height * percent);
        this.border.lineStyle(3, 0x000000, 1);
        this.border.endFill();
        this.border.drawRect(0, 0, width, height);
        // this.origin.beginFill(0xff0000);
        // this.origin.drawCircle(0, 0, 5);
        
        this.name.anchor.x = 0.5;
        this.name.anchor.y = 0.5;
        this.name.x = width/2;
        this.name.y = height/2;
        this.name.scale.y = -0.5;
        this.name.scale.x = 0.5;

        this.fb = mw*g;
        this.mg = -percent*kappa*mw*g;
        this.fb_vec = new Arrow(width/2, height/2, 0, this.fb, 0xb90025, 5);
        this.mg_vec = new Arrow(width/2, height/2, 0, this.mg, 0x6c2eb8, 5)
        this.addChild(this.sand);
        this.addChild(this.border);
        // this.addChild(this.origin);
        this.addChild(this.fb_vec);
        this.addChild(this.mg_vec);
        this.addChild(this.name);

    }
}


// lambda = 0.4;
