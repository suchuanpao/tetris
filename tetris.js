function Tetris(pos, type, dir) {
	this.turn = function () {
		var flag = 1;
		switch (this.types_name[this.type]) {
			case "SQUARE":
				return true;
			case "LINE":
				flag = this.tetris[1].y-this.centor.y?1:-1;
				break;
			case "SWAGERLY":
			case "RSWAGERLY":
				flag = this.tetris[2].y-this.centor.y?1:-1;
				break;
			case "LBLOCK":
			case "RLBLOCK":
			case "TBLOCK":
				flag = 1;
				break;
		}
		for (var i = 1; i < this.tetris.length; i++) {
			var diff = {"x":this.tetris[i].x-this.centor.x, "y":this.tetris[i].y-this.centor.y};
			this.tetris[i].x = this.centor.x + flag*diff.y;
			this.tetris[i].y = this.centor.y - flag*diff.x;
		}
		return true;
	}
	this.turnback = function () {
		if (this.types_name[this.type] == "SQUARE")
			return true;
		for (var i = 0; i < 3; i++)
			this.turn();
	}
	this.leftSlice = function () {
		this.pos.x--;
	}
	this.rightSlice = function () {
		this.pos.x++;
	}
	this.drop = function () {
		this.pos.y++;
	}
	this.rise = function() {
		this.pos.y--;
	}
	this.body = function () {
		var body = [];
		for (var i = 0; i < this.tetris.length; i++) {
			if (this.tetris[i].y+this.pos.y >= 0)
				body.push({"x":this.tetris[i].x+this.pos.x, "y":this.tetris[i].y+this.pos.y});
		}
		return body;
	}
	this.__init__ = function () {
		var arr = this.types_body[this.type];
		this.tetris = [];
		this.centor = {"x":arr[0]%4-this.origin%4, "y":parseInt(arr[0]/4)-parseInt(this.origin/4)};
		for (var i = 0; i < 4; i++) {
			this.tetris[i] = {"x":arr[i]%4-this.origin%4, "y":parseInt(arr[i]/4)-parseInt(this.origin/4)};
		}
	}
	this.types_name = ["LBLOCK", "RLBLOCK", "TBLOCK", "SWAGERLY", "RSWAGERLY", "LINE", "SQUARE"];
	this.types_body = [
		[5, 1, 2, 9], //LLL
		[6, 1, 2,10],
		[5, 1, 4, 6], //T 
		[5, 2, 6, 9], //555 
		[5, 1, 6,10], 
		[5, 4, 6, 7], //I
		[5, 0, 1, 4],
	]
	this.origin = 5;
	this.type = type%7;
	this.pos = pos;
	this.__init__();
	for (i = 0; i < dir%4; i++)
		this.turn();
	return this;
}

// 状态值与操作应应做保护，但是这是队列形式的单线程可以分离
function TetrisConsole(width, height) {
	this.getState = function () {
		return this.state;
	}
	this.getTetris = function () {
		return this.tetris.body();
	}
	this.setTetris = function (value) {
		var body = this.getTetris();
		for (var i = 0; i < body.length; i++)
			this.map[body[i].y][body[i].x] = value?1:0;
	}
	this.isRepeat = function (value) {
		var body = this.getTetris();
		for (var i = 0; i < body.length; i++) {
			if (this.map[body[i].y][body[i].x])
				return true;
		}
		return false;
	}
	this.isOutOfRange = function () {
		var body = this.getTetris();
		for (var i = 0; i < body.length; i++) {
			if (body[i].x < 0 || body[i].x > (this.width-1))
				return true;
			if (body[i].y > (this.height-1))
				return true;
		}
		return false;
	}
	this.clearBottom = function () {
		var base = this.height - 1;
		var is_clear = false;
		for (var i = this.height - 1; i > 0; i--) {
			var line = this.map[i];
			var not_full = false;
			var not_empty = false;
			for (var x = 0; x < line.length; x++) {
				if (line[x] == 0)
					not_full = true;
				else
					not_empty = true;
			}
			if (not_full&&not_empty) {
				if (i != base) {
					var base_line = this.map[base];
					for (var j = 0; j < this.width; j++)
						base_line[j]=line[j];
				}
				base--;
			} else if (!not_full) {
				is_clear = true;
			}
		}
		if (!is_clear)
			return false;
		for (i = base; i > 0; i--) {
			this.map[i].fill(0);
		}
		return true;
	}
	this.createTetris = function (pos, type, dir) {
		this.tetris = null;
		this.tetris = new Tetris({"x":parseInt(this.width/2),"y":0},
			Math.floor(Math.random()*8), Math.floor(Math.random()*5));
		return !(this.isOutOfRange()||this.isRepeat());
	}
	this.dropTetris = function () {
		this.setTetris(0);
		this.tetris.drop();
		if (this.isOutOfRange() || this.isRepeat()) {
			this.tetris.rise();
			this.setTetris(1);
			var is_update = this.clearBottom()
			if(this.createTetris()) {
				this.state = is_update?"UPDATE":"NEW";
				return true;
			} else {
				this.state = "DEAD"
				return false;
			}
		}
		this.setTetris(1);
		this.state = "MOVE";
		return true;
	}
	this.turnTetris = function () {
		this.setTetris(0);
		this.tetris.turn();
		if (this.isOutOfRange() || this.isRepeat())
			this.tetris.turnback();
		this.setTetris(1);
		this.state = "MOVE"
		return true;
	}
	this.leftSliceTetris = function () {
		this.setTetris(0);
		this.tetris.leftSlice();
		if (this.isOutOfRange() || this.isRepeat())
			this.tetris.rightSlice();
		this.setTetris(1);
		this.state = "MOVE"
		return true;
	}
	this.rightSliceTetris = function () {
		this.setTetris(0);
		this.tetris.rightSlice();
		if (this.isOutOfRange() || this.isRepeat())
			this.tetris.leftSlice();
		this.setTetris(1);
		this.state = "MOVE"
		return true;
	}
	this.keydown = function (keycode) {
		var changed_tetris;
		switch(keycode) {
			case "UP":
				this.turnTetris();
				break;
			case "DOWN":
				this.dropTetris();
				break;
			case "LEFT":
				this.leftSliceTetris();
				break;
			case "RIGHT":
				this.rightSliceTetris();
				break;
		}
	}
	this.width = width;
	this.height = height;
	this.state = "MOVE";
	this.map = [];
	for (var i = 0; i < height; i++)
		this.map[i] = new Array(width).fill(0);
	this.createTetris();
	return this;
}

