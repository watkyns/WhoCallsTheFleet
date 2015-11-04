// 舰队配置
	_frame.infos.__fleet = function( id ){
		let data = new InfosFleet(id)
			,el = data.el
		return el
	}









class InfosFleet{
	constructor( id ){
		this.el = $('<div class="infos-fleet loading"/>')
					.attr('data-infos-title', '舰队 ('+id+')')
		this.doms = {}

		this.fleets = []
		//this._updating = false
		//this.is_init = false
		
		this.tip_hqlv_input = '输入 0 表示采用默认等级 (Lv.%1$d)'
	
		if( id == '__NEW__' ){
			_db.fleets.insert( _tablelist.prototype._fleets_new_data(), function(err, newDoc){
				if(err){
					_g.error(err)
				}else{
					if( _frame.infos.curContent == 'fleet::__NEW__' )
						_frame.infos.show('[[FLEET::' + newDoc['_id'] + ']]')
						//this.init(newDoc)
				}
			}.bind(this))
		}else{
			_db.fleets.find({
				'_id': 		id
			}, function(err, docs){
				if(err || !docs){
					_g.error(err)
				}else{
					if( _frame.infos.curContent == 'fleet::' + id )
						this.init(docs[0])
				}
			}.bind(this))
		}

		this.el.on('show', function(e, is_firstShow){
			if( !is_firstShow ){
				// 再次显示时，重新计算分舰队的索敌能力
				let i = 0
					,l = Lockr.get('hqLvDefault', _g.defaultHqLv)
				while(i < 4){
					this.fleets[i].summaryCalc(true)
					i++
				}
				if( !this._hqlv )
					this.doms['hqlvOption'].val(l)
				this.doms['hqlvOptionLabel'].data('tip', this.tip_hqlv_input.printf(l) )
				this.doms['hqlvOption'].attr('placeholder', l)
			}
		}.bind(this))
	}



	// 初始化内容
	init( d ){
		if( !d )
			return false

		//$.extend(true, this, d)
		this.data = d
		//_g.log(this.data)

		let i = 0
			,defaultHqLv = Lockr.get('hqLvDefault', _g.defaultHqLv)

		this.el.attr({
				'data-fleetid': d._id,
				'data-infos-id':d._id
			})
			//.data('fleet', d)
			.removeClass('loading')
		
		// 创建DOM
			$('<header/>')
				.append(
					this.doms['name'] = $('<h3 contenteditable/>')
						.html('点击编辑标题')
						.on({
							'input': function(){
								this.update_data({})
								this.doms['name'].trigger('namechange')
							}.bind(this),
							'focus': function(){
								if( this.doms['name'].text() == '点击编辑标题' )
									this.doms['name'].html('')
							}.bind(this),
							'blur': function(){
								if( !this.doms['name'].text() )
									this.doms['name'].html('点击编辑标题')
							}.bind(this),
							'namechange': function(e, content){
								if( typeof content == 'undefined' ){
									content = this.doms['name'].text()
								}
								
								this._name = content
								return this.doms['name']
							}.bind(this),
							'keydown': function(e){
								if( e.keyCode == 13 ){
									this.doms['name'].blur()
									setTimeout(function(){
										this.doms['name'].blur()
									}.bind(this), 1)
								}
							}.bind(this)
						})
				)
				.append(
					this.doms['user'] = $('<button/>')
				)
				.appendTo(this.el)
	
			$('<div class="fleets"/>')
				.append(
					this.doms['tabs'] = $('<div class="tabs"/>')
				)
				.append(
					this.doms['options'] = $('<div class="options"/>')
						.append(
							this.doms['hqlvOptionLabel'] = $('<label/>',{
								'class':	'option option-hqlv',
								'html':		'司令部等级',
								'data-tip':	this.tip_hqlv_input.printf(defaultHqLv)
							})
							.append(
								this.doms['hqlvOption'] = $('<input/>',{
										'type':		'number',
										'min':		0,
										'max':		150,
										'placeholder': defaultHqLv
									})
									.val(this._hqlv || defaultHqLv)
									.on({
										'input': function(){
											this._hqlv = this.doms['hqlvOption'].val()
										}.bind(this),
										'focus': function(){
											this.doms['hqlvOption'].trigger('tipshow')
										}.bind(this),
										'blur': function(){
											this.doms['hqlvOption'].trigger('tiphide')
										}.bind(this),
										'click': function(e){
											e.stopImmediatePropagation()
											e.stopPropagation()
										}
									})
							)
						)
						.append(
							this.doms['theme'] = $('<select class="option option-theme-value"/>')
								.on('change', function(){
									this._theme = this.doms['theme'].val()
								}.bind(this))
								.append(function(){
									let els = $()
									for( let j=1; j<11; j++ ){
										els = els.add(
											$('<option/>',{
												'value':	j,
												'html':		'主题-'+j
											})
										)
									}
									return els
								})
						)
						.append(
							this.doms['themeOption'] = $('<button class="option option-theme mod-dropdown"/>').html('主题').on('click', function(){
								if( !InfosFleet.menuTheme ){
									InfosFleet.menuThemeItems = $('<div/>')
									for(let i=1; i<11; i++){
										$('<button class="theme-' + i + '"/>').html(i)
											.on('click', function(){
												InfosFleet.menuCur._theme = i
												this.el.attr('data-theme', this._theme)
											}.bind(this))
											.appendTo(InfosFleet.menuThemeItems)
									}
									InfosFleet.menuTheme = new _menu({
										'className': 'contextmenu-infos_fleet_themes',
										'items': [InfosFleet.menuThemeItems]
									})
								}
								InfosFleet.menuCur = this
								InfosFleet.menuTheme.show(this.doms['themeOption'])
							}.bind(this))
						)
						.append(
							this.doms['exportOption'] = $('<button class="option mod-dropdown"/>').html('导出').on('click', function(){
								if( !InfosFleet.menuExport ){
									InfosFleet.menuExport = new _menu({
										'className': 'contextmenu-infos_fleet_themes',
										'items': [
											$('<menuitem/>',{
													'html':		'导出代码'
												}).on('click', function(){
													InfosFleet.menuCur.modalExport_show()
												}),
											$('<menuitem/>',{
													'html':		'导出文本'
												}).on('click', function(){
													InfosFleet.menuCur.modalExportText_show()
												}),
											$('<menuitem/>',{
													'html':		'导出图片'
												}).on('click', function(){
													InfosFleet.menuCur.exportPic()
												})
										]
									})
								}
								InfosFleet.menuCur = this
								InfosFleet.menuExport.show(this.doms['exportOption'])
							}.bind(this))
						)
						/*
						.append(
							$('<button class="option"/>').html('导出代码').on('click', function(){
								this.modalExport_show()
							}.bind(this))
						)
						.append(
							$('<button class="option"/>').html('导出文本').on('click', function(){
								this.modalExportText_show()
							}.bind(this))
						)
						.append(
							$('<button class="option"/>').html('导出图片').on('click', function(){
								this.exportPic()
							}.bind(this))
						)
						*/
						.append(
							this.doms['optionOptions'] = $('<button class="icon" icon="cog"/>').on('click', function(){
								TablelistFleets.menuOptions_show(this.doms['optionOptions'])
							}.bind(this))
						)
						/*
						.append(
							$('<span class="option"/>').html('[PH] 阵型')
						)
						.append(
							$('<span class="option"/>').html('[PH] 导出图片')
						)
						*/
				)
				.appendTo(this.el)
	
			this.doms['ships'] = $('<div class="ships"/>').appendTo(this.el)
	
			// 4个分舰队
				while(i < 4){
					this.fleets[i] = new InfosFleetSubFleet(this, [], i)

					$('<input/>',{
							'type': 	'radio',
							'name': 	'fleet_' + d._id + '_tab',
							'id': 		'fleet_' + d._id + '_tab_' + i,
							'value': 	i
						}).prop('checked', (i == 0)).prependTo( this.el )
			
					$('<label/>',{
							'for': 		'fleet_' + d._id + '_tab_' + i,
							'data-fleet':i,
							'html': 	'#' + (i+1)
						}).appendTo( this.doms['tabs'] )

					this.fleets[i].el
						.attr('data-fleet', i)
						.appendTo( this.doms['ships'] )

					i++
				}

		// 根据数据更新DOM
			this.update( d )
		
		this._theme = this._theme
		
		// 事件: 默认司令部等级更新
			$body.on('update_defaultHqLv.fleet'+this.data._id, function(e, val){
				if( this.el.data('is_show') ){
					if( !this._hqlv )
						this.doms['hqlvOption'].val(val)
					this.doms['hqlvOptionLabel'].data('tip', this.tip_hqlv_input.printf(val) )
					this.doms['hqlvOption'].attr('placeholder', val)
				}
			}.bind(this))
	}



	// 根据数据更新内容
	update( d ){
		this._updating = true
		d = d || {}
				
		// check d.data if is JSON
		// if not, decompress and JSON.parse
			if( d['data'] && !d['data'].push ){
				try{
					d['data'] = JSON.parse( LZString.decompressFromEncodedURIComponent(d['data']) )
				}catch(e){}
			}

		// 主题颜色
			if( typeof d['theme'] != 'undefined' ){
				_frame.infos.dom.main.attr('data-theme', d['theme'])
				this.doms['theme'].val(d['theme']).attr('value', d['theme'])
			}

		// 标题
			if( typeof d['name'] != 'undefined' )
				this.doms['name'].trigger('namechange',[d['name']]).trigger('blur')

		// 分舰队
			if( d['data'] && d['data'].push ){
				d['data'].forEach(function(currentValue, i){
					//_g.log(currentValue)
					this.fleets[i].updateEl(currentValue)
				}, this)
			}
		
		this._updating = false
	}



	// 每个操作都会更新数据，并触发更新数据库倒计时
	update_data( d ){
		d = d || {}
		this.update(d)
	}



	// 更新数据库



	
	// 舰队名
		get _name(){
			return this.data['name']
		}
		set _name( value ){
			this.data['name'] = value
			this.doms['name'].html(value)

			if( value ){
				this.doms['name'].attr('data-content', value)
			}else{
				this.doms['name'].removeAttr('data-content')
			}
			
			this.save()
		}

	// 主题
		get _theme(){
			return this.data['theme']
		}
		set _theme( value ){
			this.data['theme'] = value || 1
			this.doms['theme'].val(this.data['theme']).attr('value', this.data['theme'])
			_frame.infos.dom.main.attr('data-theme', this.data['theme'])
			this.el.attr('data-theme', this.data['theme'])
			_frame.dom.main.attr('data-theme', this.data['theme'])
			this.save()
		}
	
	// 司令部等级
		get _hqlv(){
			if( this.data['hq_lv'] > 0 )
				return this.data['hq_lv']
			return 0
		}
		set _hqlv( value ){
			value = parseInt(value)
			let last = this._hqlv
			if( value && value > 0 ){
				this.data['hq_lv'] = value
				this.doms['hqlvOption'].val(value)
			}else{
				value = -1
				this.data['hq_lv'] = -1
				this.doms['hqlvOption'].val(Lockr.get('hqLvDefault', _g.defaultHqLv))
			}
			if( last != value ){
				let i = 0;
				while(i < 4){
					this.fleets[i].summaryCalc(true)
					i++
				}
				this.save()
			}
		}
	
	// 保存
		save( not_save_to_file ){
			if( this._updating )
				return this
			
			if( this.is_init ){
				this.fleets.forEach(function(currentValue, i){
					this.data.data[i] = currentValue.data
				}, this)
				
				// 更新时间
				this.data.time_modify = _g.timeNow()
				
				// 清理Array中的null值
				/*
				let deleteNull = function(arr){
					if( arr && arr.length && arr.push ){
						arr.forEach(function(value, i){
							if( value === null ){
								delete arr[i]
								console.log(arr)
							}
							if( value && value.length && value.push )
								deleteNull(value)
						})
					}
				}
				deleteNull(this.data.data)
				
				//_g.log(this)
				_g.log(JSON.stringify(this.data.data))
				*/
				
				// JSON.stringify and compress this.data.data
				try{
					this.data.data = LZString.compressToEncodedURIComponent( JSON.stringify( this.data.data ) )
				}catch(e){}
				//console.log(this.data)
				
				if( !not_save_to_file ){
					clearTimeout( this.delay_updateDb )
					this.delay_updateDb = setTimeout(function(){
						_db.fleets.updateById(this.data._id, this.data, function(){
							_g.log('saved')
						})
						clearTimeout( this.delay_updateDb )
						this.delay_updateDb = null
					}.bind(this), 1000)
				}
			}
			
			this.is_init = true			
			return this
		}
	
	// 浮动窗口
		modalExport_show(){
			InfosFleet.modalExport_show(this.data)
		}
		modalExportText_show(){
			InfosFleet.modalExportText_show(this.data)
		}
	
	// 导出图片
		exportPic(){
			if( !InfosFleet.fileDialog_export ){
				InfosFleet.fileDialog_export = $('<input type="file" accept=".png" nwsaveas/>')
					.on({
						'click': function(e, windowWidth, windowHeight){
							InfosFleet.fileDialog_export.data({
									'windowWidth':	windowWidth,
									'windowHeight': windowHeight
								})
							InfosFleet.fileDialog_export_showing = true
						},
						'change': function(){
							let path = InfosFleet.fileDialog_export.val()
							InfosFleet.fileDialog_export.val('')
							
							_g.log('changed')
							
							setTimeout(function(){
								node.win.capturePage(function(buffer){
									let wstream = node.fs.createWriteStream(path);
									wstream.write(buffer);
									wstream.end();
								}, { format : 'png', datatype : 'buffer'})
							}, 0)
						},
						'resetCaptureMode': function(){
							if( !InfosFleet.fileDialog_export.val() && $body.hasClass('mod-capture') ){
								$body.removeClass('mod-capture')
								node.win.resizeTo(
									InfosFleet.fileDialog_export.data('windowWidth'),
									InfosFleet.fileDialog_export.data('windowHeight')
								)
								InfosFleet.fileDialog_export.data({
										'windowWidth':	null,
										'windowHeight': null
									})
								_menu.hideAll()
							}
						}
					})
					.appendTo(_frame.dom.hidden)
				$window.on('focus.resetCaptureMode', function(){
					if( InfosFleet.fileDialog_export_showing )
						setTimeout(function(){
							InfosFleet.fileDialog_export.trigger('resetCaptureMode')
							InfosFleet.fileDialog_export_showing = false
						}, 100)
				})
			}
			// 存储当前窗口尺寸
				let windowWidth = $window.width()
					,windowHeight = $window.height()
			
			// 改变样式
				$body.addClass('mod-capture')
				node.win.resizeTo( 1280, 720 )
			
			// 选择文件
				InfosFleet.fileDialog_export.trigger('click', [windowWidth, windowHeight])
		}
}
InfosFleet.modalExport = function(curval){
	if( !InfosFleet.elModalExport ){
		InfosFleet.elModalExport = $('<div/>')
			.append(
				InfosFleet.elModalExportTextarea = $('<textarea/>',{
					'readonly': true
				})
			)
			.append(
				$('<p class="note-codeusage"/>').html('* 该配置代码可用于<a href="http://www.kancolle-calc.net/deckbuilder.html">艦載機厨デッキビルダー</a>')
			)
			.append(
				$('<button class="button"/>').html('复制到剪切板')
					.on('click', function(){
						node.clipboard.set(InfosFleet.elModalExportTextarea.val(), 'text');
					})
			)
	}
	InfosFleet.elModalExportTextarea.val(curval || '')
	
	return InfosFleet.elModalExport
}
InfosFleet.modalExport_show = function(data){
	data = data.data || []

	/*
	data = JSON.stringify(data)
	while( data.indexOf(',null]') > -1 )
		data = data.replace(/\,null\]/g,']')
	while( data.indexOf('[null]') > -1 )
		data = data.replace(/\[null\]/g,'[]')
	*/
	
	data = JSON.stringify( _g.kancolle_calc.encode(data) )

	_frame.modal.show(
		InfosFleet.modalExport(data),
		'导出配置代码',
		{
			'classname': 	'infos_fleet infos_fleet_export'
		}
	)
}
InfosFleet.modalExportText_show = function(data){
	if( !data )
		return false
	
	let text = ''
		,fleets = data.data.filter(function(value){
						return value.length
					}) || []
	
	text+= data.name || ''
	
	fleets.forEach(function(fleet, i){
		//console.log(fleet)
		text+= (text ? '\n' : '')
			+ ( fleets.length > 1 ? '\n第 ' + (i+1) + ' 舰队' : '')
		fleet.filter(function(value){
			return value.length > 0 && value[0] 
		}).forEach(function(ship, j){
			text+= '\n'
				+ '(' + (i ? (i+1) + '-' : '') + (j+1) + ')'
				+ _g.data.ships[ship[0]]._name
				+ ( ship[1] && ship[1][0] ? ' Lv.' + ship[1][0] : '' )
			let equipments = ship[2] || []
				,stars = ship[3] || []
				,ranks = ship[4] || []
			equipments.filter(function(value){
				return value
			}).forEach(function(equipment, k){
				text+= (!k ? ' | ' : ', ')
					+ _g.data.items[equipment]._name
					+ (stars[k] ? '★'+stars[k] : '')
					+ (ranks[k] ? '['+_g.textRank[ranks[k]]+']' : '')
			})
		})
	})
	
	text+= (text ? '\n\n' : '')
		+ '* 创建自 是谁呼叫舰队 (fleet.diablohu.com)'

	_frame.modal.show(
		InfosFleet.modalExport(text),
		'导出配置文本',
		{
			'classname': 	'infos_fleet infos_fleet_export mod-text'
		}
	)
}







// 类：子舰队
class InfosFleetSubFleet{
	constructor(infosFleet, d, index){
		d = d || []
		this.data = d

		this.el = $('<dl class="fleetinfos-ships"/>')
		
		this.ships = []

		// 6个舰娘
			let i = 0
			while( i < 6 ){
				this.ships[i] = new InfosFleetShip(infosFleet, this, i)
				this.ships[i].getEl().appendTo( this.el )
				//$('<s/>').appendTo( this.el )
				i++
			}
		
		// 舰队综合属性
			this.elSummary = $('<span class="summary"/>')
				//.html('<h4 data-content="舰队数据">舰队数据</h4>')
				.appendTo( this.el )
				.append(
					$('<span class="summary-item"/>')
						.html('航速')
						.append(
							this.elSummarySpeed = $('<strong/>').html('-')
						)
				)
				.append(
					$('<span class="summary-item"/>')
						.html('制空战力')
						.append(
							this.elSummaryFighterPower = $('<strong/>').html('-')
						)
				)
				.append(
					$('<span class="summary-item"/>')
						.html('索敌能力')
						.append(
							this.elSummaryLos = $('<strong/>').html('-')
						)
				)
				.append(
					$('<span class="summary-item summary-item-consummation"/>')
						.html('总消耗')
						.append(
							this.elSummaryConsummation = $('<strong/>').html('-')
						)
				)
				/*
				.append(
					$('<span class="summary-item"/>')
						.html('索敌能力')
						.append(
							this.elSummaryLOS = $('<strong/>')
						)
				)*/
		
		this.infosFleet = infosFleet

		this.updateEl()
		
		// 事件: 默认司令部等级更新
			$body.on('update_defaultHqLv.fleet'+infosFleet.data._id+'-'+(index+1), function(){
				if( this.infosFleet.el.data('is_show') )
					this.summaryCalc(true)
			}.bind(this))
	}


	// 更新元数据
	
	// 根据元数据更新页面元素
		updateEl(d){
			this.data = d || this.data
			if( d )
				d.forEach(function(currentValue, i){
					this.ships[i].updateEl(currentValue)
				}, this)
		}
	
	// 获取当前状态的元数据
		getData(){
			return this.data
		}
	
	// 遍历该子舰队下全部装备，计算相关舰队数据
		summaryCalc( is_onlyHqLvChange ){
			if( this.summaryCalculating )
				return false
			
			this.summaryCalculating = setTimeout(function(){
				if( !is_onlyHqLvChange ){
					let fighterPower = [0, 0]
						//,fighterPower = 0
						//,los = {}
						,fleetSpeet = 'fast'
						,consumFuel = 0
						,consumAmmo = 0
					
					this.ships.forEach(function(shipdata){
						if( shipdata.data[0] ){
							let ship = _g.data.ships[shipdata.data[0]]
							
							// 航速
								if( ship.stat.speed < 10 )
									fleetSpeet = 'slow'
							
							// 制空战力
								//fighterPower+= shipdata.calculate('fighterPower')
								shipdata.calculate('fighterPower_v2').forEach(function(val, i){
									fighterPower[i]+= val > 0 ? val : 0
								})
							
							// 索敌能力
							/*
								let losData = shipdata.calculate('losPower')
								for(let i in losData){
									if( typeof losData[i] == 'object' ){
										los[i] = los[i] || {}
										for(let j in losData[i]){
											los[i][j] = los[i][j] || 0
											los[i][j]+= losData[i][j]
										}
									}else{
										los[i] = los[i] || 0
										los[i]+= losData[i]
									}
								}
								*/
							
							// 总消耗
								consumFuel+= ship.getAttribute('fuel', shipdata.shipLv) || 0
								consumAmmo+= ship.getAttribute('ammo', shipdata.shipLv) || 0
						}
					})
					
					this.elSummarySpeed.html( fleetSpeet == 'fast' ? '高速' : '低速' )
					
					//this.elSummaryFighterPower.html( fighterPower > 0 ? Math.floor(fighterPower) : '-' )
					//if( fighterPower > 0 )
					//	this.elSummaryFighterPower.removeClass('empty')
					//else
					//	this.elSummaryFighterPower.addClass('empty')
					if( Math.max( fighterPower[0], fighterPower[1] ) > 0 ){
						let val1 = Math.floor(fighterPower[0])
							,val2 = Math.floor(fighterPower[1])
						this.elSummaryFighterPower.html(
							val1 == val2
								? val1
								: val1 + '~' + val2
						)
						this.elSummaryFighterPower.removeClass('empty')
					}else{
						this.elSummaryFighterPower.html( '-' )
						this.elSummaryFighterPower.addClass('empty')
					}
					
					this.elSummaryConsummation.html(
						(consumFuel || consumAmmo)
							? '<span class="fuel">' + consumFuel + '</span><span class="ammo">' + consumAmmo + '</span>'
							: '-'
					)
				}

				let los = this.summaryCalcLos()
				if( los.y_estimate && los.y_std_error ){
					//_g.log(los)
					let losMin = (los.y_estimate - los.y_std_error).toFixed(1)
						,losMax = (los.y_estimate + los.y_std_error).toFixed(1)
					if( losMin < 0 )
						losMin = 0
					if( losMax < 0 )
						losMax = 0
					this.elSummaryLos.html( losMin == losMax ? losMin : losMin + '~' + losMax )
				}

				this.summaryCalculating = null
			}.bind(this), 10)
		}
	
	// 计算: 索敌能力
		summaryCalcLos(){
			//Formula.calcBySlot.losPower = function(ship, equipments_by_slot, star_by_slot, rank_by_slot, options){
			// http://biikame.hatenablog.com/entry/2014/11/14/224925
			
			var calc = function (x) {
				x = $.extend({'(Intercept)': 1}, x);
				x['hqLv'] = (Math.ceil(x['hqLv'] / 5) * 5);
				var x_estimate = {};
				var y_estimate = 0;
				$.each(keys, function () {
					var estimate = x[this] * estimate_coefficients[this];
					x_estimate[this] = estimate;
					y_estimate += estimate;
				});
				var x_std_error = {};
				$.each(keys, function () {
					x_std_error[this] = x[this] * std_error_coefficients[this];
				});
				var y_std_error = 0;
				$.each(keys, function () {
					var key1 = this;
					$.each(keys, function () {
						var key2 = this;
						y_std_error += x_std_error[key1] * x_std_error[key2] * correlation[key1][key2];
					});
				});
				return {
					x_estimate: x_estimate
					, y_estimate: y_estimate
					, x_std_error: x_std_error
					, y_std_error: y_std_error
				};
			};
			var keys = [
				'(Intercept)'
				, 'DiveBombers'
				, 'TorpedoBombers'
				, 'CarrierRecons'
				, 'SeaplaneRecons'
				, 'SeaplaneBomber'
				, 'SmallRadars'
				, 'LargeRadars'
				, 'Searchlights'
				, 'statLos'
				, 'hqLv'
			];
			var estimate_coefficients = {
				'(Intercept)': 0
				, 'DiveBombers': 1.03745043134563
				, 'TorpedoBombers': 1.3679056374142
				, 'CarrierRecons': 1.65940512636315
				, 'SeaplaneRecons': 2
				, 'SeaplaneBomber': 1.77886368594467
				, 'SmallRadars': 1.0045778494921
				, 'LargeRadars': 0.990738063979571
				, 'Searchlights': 0.906965144360512
				, 'statLos': 1.6841895400986
				, 'hqLv': -0.614246711531445
			};
			var std_error_coefficients = {
				'(Intercept)': 4.66445565766347
				, 'DiveBombers': 0.0965028505325845
				, 'TorpedoBombers': 0.108636184978525
				, 'CarrierRecons': 0.0976055279516298
				, 'SeaplaneRecons': 0.0866229392463539
				, 'SeaplaneBomber': 0.0917722496848294
				, 'SmallRadars': 0.0492773648320346
				, 'LargeRadars': 0.0491221486053861
				, 'Searchlights': 0.0658283797225724
				, 'statLos': 0.0781594211213618
				, 'hqLv': 0.0369222352426548
			};
			var correlation = {
				'(Intercept)': {
					'(Intercept)': 1
					, 'DiveBombers': -0.147020064768061
					, 'TorpedoBombers': -0.379236131621529
					, 'CarrierRecons': -0.572858669501918
					, 'SeaplaneRecons': -0.733913857017495
					, 'SeaplaneBomber': -0.642621825152428
					, 'SmallRadars': -0.674829588068364
					, 'LargeRadars': -0.707418111752863
					, 'Searchlights': -0.502304601556193
					, 'statLos': -0.737374218573832
					, 'hqLv': -0.05071933950163
				}
				, 'DiveBombers': {
					'(Intercept)': -0.147020064768061
					, 'DiveBombers': 1
					, 'TorpedoBombers': 0.288506347076736
					, 'CarrierRecons': 0.365820372770994
					, 'SeaplaneRecons': 0.425744409856409
					, 'SeaplaneBomber': 0.417783698791503
					, 'SmallRadars': 0.409046013184429
					, 'LargeRadars': 0.413855653833994
					, 'Searchlights': 0.308730607324667
					, 'statLos': 0.317984916914851
					, 'hqLv': -0.386740224500626
				}
				, 'TorpedoBombers': {
					'(Intercept)': -0.379236131621529
					, 'DiveBombers': 0.288506347076736
					, 'TorpedoBombers': 1
					, 'CarrierRecons': 0.482215071254241
					, 'SeaplaneRecons': 0.584455876852325
					, 'SeaplaneBomber': 0.558515133495825
					, 'SmallRadars': 0.547260012897553
					, 'LargeRadars': 0.560437619378443
					, 'Searchlights': 0.437934879351188
					, 'statLos': 0.533934507932748
					, 'hqLv': -0.405349979885748
				}
				, 'CarrierRecons': {
					'(Intercept)': -0.572858669501918
					, 'DiveBombers': 0.365820372770994
					, 'TorpedoBombers': 0.482215071254241
					, 'CarrierRecons': 1
					, 'SeaplaneRecons': 0.804494553748065
					, 'SeaplaneBomber': 0.75671307047535
					, 'SmallRadars': 0.748420581669228
					, 'LargeRadars': 0.767980338133817
					, 'Searchlights': 0.589651513349878
					, 'statLos': 0.743851348255527
					, 'hqLv': -0.503544281376776
				}
				, 'SeaplaneRecons': {
					'(Intercept)': -0.733913857017495
					, 'DiveBombers': 0.425744409856409
					, 'TorpedoBombers': 0.584455876852325
					, 'CarrierRecons': 0.804494553748065
					, 'SeaplaneRecons': 1
					, 'SeaplaneBomber': 0.932444440578382
					, 'SmallRadars': 0.923988080549326
					, 'LargeRadars': 0.94904944359066
					, 'Searchlights': 0.727912987329348
					, 'statLos': 0.944434077970518
					, 'hqLv': -0.614921413821462
				}
				, 'SeaplaneBomber': {
					'(Intercept)': -0.642621825152428
					, 'DiveBombers': 0.417783698791503
					, 'TorpedoBombers': 0.558515133495825
					, 'CarrierRecons': 0.75671307047535
					, 'SeaplaneRecons': 0.932444440578382
					, 'SeaplaneBomber': 1
					, 'SmallRadars': 0.864289865445084
					, 'LargeRadars': 0.886872388674911
					, 'Searchlights': 0.68310647756898
					, 'statLos': 0.88122333327317
					, 'hqLv': -0.624797255805045
				}
				, 'SmallRadars': {
					'(Intercept)': -0.674829588068364
					, 'DiveBombers': 0.409046013184429
					, 'TorpedoBombers': 0.547260012897553
					, 'CarrierRecons': 0.748420581669228
					, 'SeaplaneRecons': 0.923988080549326
					, 'SeaplaneBomber': 0.864289865445084
					, 'SmallRadars': 1
					, 'LargeRadars': 0.872011318623459
					, 'Searchlights': 0.671926570242336
					, 'statLos': 0.857213501657084
					, 'hqLv': -0.560018086758868
				}
				, 'LargeRadars': {
					'(Intercept)': -0.707418111752863
					, 'DiveBombers': 0.413855653833994
					, 'TorpedoBombers': 0.560437619378443
					, 'CarrierRecons': 0.767980338133817
					, 'SeaplaneRecons': 0.94904944359066
					, 'SeaplaneBomber': 0.886872388674911
					, 'SmallRadars': 0.872011318623459
					, 'LargeRadars': 1
					, 'Searchlights': 0.690102027588321
					, 'statLos': 0.883771367337743
					, 'hqLv': -0.561336967269448
				}
				, 'Searchlights': {
					'(Intercept)': -0.502304601556193
					, 'DiveBombers': 0.308730607324667
					, 'TorpedoBombers': 0.437934879351188
					, 'CarrierRecons': 0.589651513349878
					, 'SeaplaneRecons': 0.727912987329348
					, 'SeaplaneBomber': 0.68310647756898
					, 'SmallRadars': 0.671926570242336
					, 'LargeRadars': 0.690102027588321
					, 'Searchlights': 1
					, 'statLos': 0.723228553177704
					, 'hqLv': -0.518427865593732
				}
				, 'statLos': {
					'(Intercept)': -0.737374218573832
					, 'DiveBombers': 0.317984916914851
					, 'TorpedoBombers': 0.533934507932748
					, 'CarrierRecons': 0.743851348255527
					, 'SeaplaneRecons': 0.944434077970518
					, 'SeaplaneBomber': 0.88122333327317
					, 'SmallRadars': 0.857213501657084
					, 'LargeRadars': 0.883771367337743
					, 'Searchlights': 0.723228553177704
					, 'statLos': 1
					, 'hqLv': -0.620804120587684
				}
				, 'hqLv': {
					'(Intercept)': -0.05071933950163
					, 'DiveBombers': -0.386740224500626
					, 'TorpedoBombers': -0.405349979885748
					, 'CarrierRecons': -0.503544281376776
					, 'SeaplaneRecons': -0.614921413821462
					, 'SeaplaneBomber': -0.624797255805045
					, 'SmallRadars': -0.560018086758868
					, 'LargeRadars': -0.561336967269448
					, 'Searchlights': -0.518427865593732
					, 'statLos': -0.620804120587684
					, 'hqLv': 1
				}
			};
			
			let hq_lv = this.infosFleet.data.hq_lv || Lockr.get('hqLvDefault', _g.defaultHqLv)
			if( hq_lv < 0 )
				hq_lv = Lockr.get('hqLvDefault', _g.defaultHqLv)
			
			var x = {
				'DiveBombers': 		0,
				'TorpedoBombers': 	0,
				'CarrierRecons':	0,
				'SeaplaneRecons':	0,
				'SeaplaneBomber':	0,
				'SmallRadars':		0,
				'LargeRadars':		0,
				'Searchlights':		0,
				'statLos':			0,
				'hqLv':				hq_lv,
			};
			
			this.ships.forEach(function(shipdata){
				if( shipdata && shipdata.shipId ){
					// ship, equipments_by_slot, star_by_slot, rank_by_slot, options
					// shipdata.shipId, shipdata.data[2], shipdata.data[3], shipdata.data[4]
					let equipments_by_slot = shipdata.data[2].map(function(equipment){
							if( !equipment )
								return null
							if( equipment instanceof Equipment )
								return equipment
							return _g.data.items[equipment]
						}) || []
					equipments_by_slot.forEach(function(equipment){
						if( equipment ){
							//console.log(equipment)
							for(let i in x){
								if( Formula.equipmentType[i]
									&& Formula.equipmentType[i].push
									&& Formula.equipmentType[i].indexOf(equipment.type) > -1
								)
									x[i]+= equipment.stat.los
								}
						}
					})
					let shipLv = shipdata.shipLv || 1
					if( shipLv < 0 )
						shipLv = 1
					x.statLos+= Math.sqrt(_g.data.ships[shipdata.shipId].getAttribute('los', shipLv))
				}
			})
			
			return calc(x);
			//var result = calc(x);
			//var score = result.y_estimate.toFixed(1) + ' ± ' + result.y_std_error.toFixed(1);
		}



	
	// 保存
		save(){
			// 如果该子舰队下没有任何数据，则存储数据时不传输该子舰队数据
			let allEmpty = true
			this.data = this.data || []
			
			this.ships.forEach(function(currentValue,i){
				this.data[i] = currentValue.data
				
				if( currentValue.data[0] )
					allEmpty = false
			}, this)
			
			if( allEmpty )
				this.data = null
			
			if( this.infosFleet )
				this.infosFleet.save()
		}
}







// 类：舰娘
class InfosFleetShip{
	constructor(infosFleet, infosFleetSubFleet, index, d){
		// 数据结构
		/* [
				STRING 舰娘ID,
				[
					NUMBER 等级,
					NUMBER 运，如果没有特殊指定则为 -1
				],
				[
					NUMBER 装备ID,	// 实际装备
					...
				],
				[
					NUMBER 改修星级,	// 实际装备
					...
				],
				[
					NUMBER 熟练度, 	// 实际装备
				]
			]*/
		// 数据实例
		// ["319",[91,40],[50,58,58,101],[7,6,0,0]]
		// ["144",[96,-1],[122,29,88],[1,0,0]
		// ["145",[96,-1],[122,29,29],[]]
		// ["403",[83,-1],[127,58],[0,0]]
		
		// 数据正在更新中，禁止触发任何存储操作
		//this._updating = false

		if( this.el )
			return this.el

		d = d || [null, [null, -1], [], [], []]
		this.data = d
		this.infosFleet = infosFleet
		this.infosFleetSubFleet = infosFleetSubFleet		
		this.equipments = []
		this.index = index
		
		this.el = $('<dd class="noship"/>')
			// 头像 & 名称
			.append(
				$('<dt/>')
					.append(
						this.elAvatar = $('<s/>').on({
							'mousedown': function(e){
								e.preventDefault()
								if( this.data[0] )
									InfosFleetShip.dragStart( this )
							}.bind(this)
						})
					)
					.append(
						this.elInfos = $('<div/>').html('<span>选择舰娘...</span>')
							.append(
								this.elInfosTitle = $('<div class="title"/>')
							)
							.append(
								$('<div class="info"/>')
									.append(
										$('<label/>').html('Lv.')
											.append(
												this.elInputLevel = $('<input/>',{
													'type':	'number',
													'min':	0,
													'max':	150
												}).on({
													'change': function(e){
														let value = this.elInputLevel.val()
														
														if( (typeof value == 'undefined' || value === '') && this.data[1][0] )
															this.shipLv = null
														
														value = parseInt(value)
														if( value < 0 ){
															value = 0
															this.elInputLevel.val(0)
														}else if( value > 150 ){
															value = 150
															this.elInputLevel.val(150)
														}
														if( !isNaN(value) && this.data[1][0] != value )
															this.shipLv = value
													}.bind(this),
													'input': function(){
														this.elInputLevel.trigger('change')
													}.bind(this)
												})
											)
									)
									.append(
										this.elInfosInfo = $('<span/>')
									)
							)
					)
			)
			// 装备
			.append(
				$('<div class="equipments"/>').append(function(){
					let els = $()
					for( let i=0; i<4; i++ ){
						this.equipments[i] = new InfosFleetShipEquipment(this, i)
						els = els.add(this.equipments[i].el)
					}
					//this.elAttrbutes = $('<div class="equipment"/>')
					//els = els.add(this.elAttrbutes)
					return els
				}.bind(this))
			)
			// 属性
			.append(
				$('<div class="attributes"/>')
					.append(
						this.elAttrShelling = $('<span class="shelling"/>')
					)
					.append(
						this.elAttrTorpedo = $('<span class="torpedo"/>')
					)
					.append(
						this.elAttrHitSum = $('<span class="hitsum"/>')
					)
					.append(
						this.elAttrHp = $('<span class="hp"/>')
					)
					.append(
						this.elAttrArmor = $('<span class="armor"/>')
					)
					.append(
						this.elAttrEvasion = $('<span class="evasion"/>')
					)
					.append(
						this.elAttrNightBattle = $('<span class="nightbattle" data-text="夜战"/>')
					)
				/*
					.append($('<span class="shelling"/>').html('炮击力').append(
						this.elAttrShelling = $('<strong/>').html('-')
					))
					*/
			)
			// 选项/操作
			.append(
				$('<div class="options"/>')
					.append(
						this.elBtnOptions = $('<button class="options"/>').on('click', function(e){
								this.showMenu()
							}.bind(this))
					)
				/*
					.append(
						$('<button/>',{
							'html':			'i',
							'data-tip':		'查看资料'
						}).on('click', function(e){
								_frame.infos.show('[[SHIP::'+this.shipId+']]', $(this))
								e.stopPropagation()
							}.bind(this))
					)
					.append(
						$('<button/>').html('×')
							.on('click', function(e){
								this.shipId = null
								e.preventDefault()
								e.stopPropagation()
							}.bind(this))
					)*/
			)
			// 事件
			.on({
				// [点击] 无舰娘时，选择舰娘
					'click': function(){
						if( !this.data[0] )
							this.selectShipStart()
					}.bind(this),
					
					'mouseenter': function(e){
						InfosFleetShip.dragEnter(this)
					}.bind(this)
			})
		
		this.after = $('<s/>')
		
		this.els = this.el.add(this.after)

		//this.updateEl()
	}
	
	// 返回页面元素
		getEl(){
			return this.els
		}
	
	// 开始选择
		selectShipStart(){
			_g.log('开始选择舰娘')

			//_frame.infos.hide()
			//_frame.app_main.cur_page = null
			_frame.app_main.load_page('ships', {
				callback_modeSelection_select:		function(id){
					history.back()
					this.shipId = id
					this.shipLv = null
					if( this.infosFleet )
						_frame.infos.dom.main.attr('data-theme', this.infosFleet.data['theme'])
				}.bind(this)
			})
		}
	
	// 更改运
		changeLuck(luck){
			this.data[1][1] = luck || -1
		}
	
	// 计算并显示属性
		updateAttrs(){
			this.elAttrShelling.html( this.calculate('shellingDamage') )
			this.elAttrTorpedo.html( this.calculate('torpedoDamage') )
			
			let hitSum = this.calculate('addHit')
				if( hitSum >= 0 )
					this.elAttrHitSum.removeClass('negative')
				else
					this.elAttrHitSum.addClass('negative')
				this.elAttrHitSum.html( hitSum )

			this.elAttrHp.html( this.calculate('attribute', 'hp') )
			this.elAttrArmor.html( this.calculate('attribute', 'armor') + this.calculate('addArmor') )
			
			let attrEvasion = this.shipLv ? this.calculate('attribute', 'evasion') : -1
				this.elAttrEvasion.html( attrEvasion >= 0
											? attrEvasion + this.calculate('addEvasion')
											: '-' )

			this.elAttrNightBattle.html( this.calculate('nightBattle') )
		}
	
	// 单项属性计算
		calculate(type, attr){
			if( !this.shipId )
				return '-'
			if( type == 'attribute' )
				return _g.data.ships[this.shipId].getAttribute(attr, this.shipLv)
			if( Formula[type] ){
				switch(type){
					case 'losPower':
						return Formula[type]( this.shipId, this.data[2], this.data[3], this.data[4], {
							'hqLv':		this.infosFleet.data.hq_lv,
							'shipLv':	this.shipLv
						} )
						break;
					default:
						return Formula[type]( this.shipId, this.data[2], this.data[3], this.data[4] )
						break;
				}
			}
			return '-'
		}

	// 更新元数据
	
	// 根据元数据更新页面元素
		updateEl(d){
			this._updating = true
			
			this.data = d || this.data
		
			if( typeof this.data[0] == 'string' )
				this.data[0] = parseInt(this.data[0])
			if( !this.data[2] )
				this.data[2] = []
			if( !this.data[3] )
				this.data[3] = []
			if( !this.data[4] )
				this.data[4] = []
			
			if( this.data[0] )
				this.shipId = this.data[0]
			
			if( this.data[1][0] )
				this.shipLv = this.data[1][0]
			
			for( let i=0; i<4; i++ ){
				this.equipments[i].id = this.data[2][i]
				this.equipments[i].star = this.data[3][i]
				this.equipments[i].rank = this.data[4][i]
			}
			
			this.updateAttrs()
			
			this._updating = false
		}
	
	// 获取当前状态的元数据
		getData(){
			return this.data
		}
	
	// 显示舰娘相关操作菜单
		showMenu(){
			InfosFleetShip.menuCurObj = this
		
			if( !InfosFleetShip.menu ){
				InfosFleetShip.menuItems = [
					$('<menuitem class="move move-up"/>').html(' ')
						.on({
							'click': function(e){
								InfosFleetShip.menuCurObj.moveUp()
							},
							'show': function(){
								if( InfosFleetShip.menuCurObj.index )
									InfosFleetShip.menuItems[0].removeClass('disabled')
								else
									InfosFleetShip.menuItems[0].addClass('disabled')
							}
						}),
					$('<menuitem class="move move-down"/>').html(' ')
						.on({
							'click': function(e){
								InfosFleetShip.menuCurObj.moveDown()
							},
							'show': function(){
								if( InfosFleetShip.menuCurObj.index < 5 )
									InfosFleetShip.menuItems[1].removeClass('disabled')
								else
									InfosFleetShip.menuItems[1].addClass('disabled')
							}
						}),
					
					$('<hr/>'),
					
					$('<menuitem/>').html('查看资料')
						.on({
							'show': function(){
								InfosFleetShip.menuItems[3].attr(
									'data-infos',
									'[[SHIP::'+InfosFleetShip.menuCurObj.shipId+']]'
								)
							}
						}),
						
					$('<menuitem/>').html('移除')
						.on({
							'click': function(e){
								InfosFleetShip.menuCurObj.shipId = null
							}
						}),
						
					$('<menuitem/>').html('替换为 ...')
						.on({
							'click': function(e){
								InfosFleetShip.menuCurObj.selectShipStart()
							}
						}),
						
					$('<div/>').on('show', function(){
						var $div = InfosFleetShip.menuItems[6].empty()
						if( InfosFleetShip.menuCurObj.shipId ){
							var series = _g['data']['ships'][InfosFleetShip.menuCurObj.shipId].getSeriesData() || []
							if( series.length > 1 ){
								series.forEach(function(currentValue, i){
									if( !i )
										$div.append($('<hr/>'))
									if( currentValue['id'] != InfosFleetShip.menuCurObj.shipId )
									$div.append(
										$('<menuitem/>')
											.html('替换为 ' + _g['data']['ships'][currentValue['id']].getName(true))
											.on({
												'click': function(){
													InfosFleetShip.menuCurObj.shipId = currentValue['id']
												}
											})
									)
								})
							}
						}
					})
				]
				InfosFleetShip.menu = new _menu({
					'className': 'contextmenu-ship',
					'items': InfosFleetShip.menuItems
				})
			}
		
			InfosFleetShip.menu.show(this.elBtnOptions)
		}
	
	// 移动
		swap(target, save){
			if( typeof target == 'number' )
				target = this.infosFleetSubFleet.ships[target]

			if( this.index > target.index ){
				this.el.insertBefore(target.el)
			}else{
				this.el.insertAfter(target.after)
			}
			this.after.insertAfter(this.el)
			
			let newIndex_dragging = target.index
				,newIndex_enter = this.index
			
			console.log(newIndex_dragging, newIndex_enter)
			
			this.index = newIndex_dragging
			target.index = newIndex_enter
			this.infosFleetSubFleet.ships[newIndex_dragging] = this
			this.infosFleetSubFleet.ships[newIndex_enter] = target
			
			if( save )
				this.save()
		}
		moveUp(){
			if( this.index <= 0 )
				return
			
			this.swap( this.index - 1, true )
		}
		moveDown(){
			if( this.index >= 5 )
				return
			
			this.swap( this.index + 1, true )
		}
	
	
	
	// 舰娘ID
		get shipId(){
			return this.data[0]
		}
		set shipId( value ){
			if( value != this.data[0] ){
				this.data[0] = value
				this.shipLv = null
			}
			
			if( value ){
				let ship = _g.data.ships[value]
					,suffix = ship.getSuffix()
					,speed = ship._speed
					,stype = ship._type
				
				stype = stype.replace(speed, '')
					
				this.el.attr('data-shipId', value)
				this.el.removeClass('noship')
				this.elAvatar.html('<img src="' + ship.getPic(10) + '"/>')
				this.elInfosTitle.html('<h4 data-content="'+ship['name'][_g.lang]+'">' +ship['name'][_g.lang]+'</h4>'
										+ ( suffix
											? '<h5 data-content="'+suffix+'">' +suffix+'</h5>'
											: ''
										)
									)
				this.elInfosInfo.html( speed + ' ' + stype )
				
				// 装备栏数据
					for( let i=0; i<4; i++ ){
						this.equipments[i].carry = ship.slot[i]
						if( !this._updating ){
							this.equipments[i].id = null
							this.equipments[i].star = null
							this.equipments[i].rank = null
						}
					}
			}else{
				this.el.removeAttr('data-shipId')
				this.el.addClass('noship')
				this.elAvatar.html('')
				this.data[2] = []
				this.data[3] = []
				this.data[4] = []
				// [null, [null, -1], [], [], []]
			}
			
			this.save()
		}
	
	// 舰娘等级
		get shipLv(){
			return this.data[1][0]
		}
		set shipLv( value ){
			this.data[1][0] = value || null
			if( value && value > 0 ){
				this.elInputLevel.val( value )
			}else{
				this.elInputLevel.val('')
			}
			//this.el.attr('data-shipLv', value)
			
			this.save()
		}
	
	// 舰娘运
	
	// 保存
		save(){
			if( this._updating )
				return false

			/*
			// 计算属性
				if( !this._updateTimeout ){
					this._updateTimeout = setTimeout(function(){
						this.updateAttrs()
						this.infosFleetSubFleet.summaryCalc()
						this._updateTimeout = null
					}.bind(this), 10)
				}

			if( !this._saveTimeout ){
				this._saveTimeout = setTimeout(function(){
					if( this.infosFleetSubFleet )
						this.infosFleetSubFleet.save()
					
					this._saveTimeout = null
				}.bind(this), 1000)
			}
			*/
			if( !this._updateTimeout ){
				this._updateTimeout = setTimeout(function(){
					this.updateAttrs()
					if( this.infosFleetSubFleet ){
						this.infosFleetSubFleet.summaryCalc()
						this.infosFleetSubFleet.save()
					}
					this._updateTimeout = null
				}.bind(this), 50)
			}
		}
}
InfosFleetShip.dragStart = function(infosFleetShip){
	if( InfosFleetShip.dragging || !infosFleetShip )
		return false

	InfosFleetShip.dragging = infosFleetShip
	infosFleetShip.el.addClass('moving')
	
	if( !InfosFleetShip.isInit ){
		$body.on({
			'mouseup.InfosFleetShip_dragend': function(){
				if( InfosFleetShip.dragging ){
					InfosFleetShip.dragging.el.removeClass('moving')
					InfosFleetShip.dragging.save()
					InfosFleetShip.dragging = null
				}
			}
		})
		InfosFleetShip.isInit = true
	}
}
InfosFleetShip.dragEnter = function(infosFleetShip_enter){
	if( !InfosFleetShip.dragging || !infosFleetShip_enter || InfosFleetShip.dragging == infosFleetShip_enter )
		return false
	
	InfosFleetShip.dragging.swap(infosFleetShip_enter)
}







// 类：装备
class InfosFleetShipEquipment{
	constructor(infosFleetShip, index){
		// 数据结构
		/* [
				STRING 舰娘ID,
				[
					NUMBER 等级,
					NUMBER 运，如果没有特殊指定则为 -1
				],
				[
					NUMBER 装备ID,	// 实际装备
					...
				],
				[
					NUMBER 改修星级,	// 实际装备
					...
				]
			]*/
		// 数据实例
		// ["319",[91,40],[50,58,58,101],[7,6,0,0]]
		// ["144",[96,-1],[122,29,88],[1,0,0]
		// ["145",[96,-1],[122,29,29],[]]
		// ["403",[83,-1],[127,58],[0,0]]

		// 直接对 infosFleetShip.data 相关数据进行读写 
		
		this.index = index || 0
		this.infosFleetShip = infosFleetShip
		
		// 数据正在更新中，禁止触发任何存储操作
		//this._updating = false

		if( this.el )
			return this.el
		
		this.el = $('<div class="equipment"/>')
					.append(
						this.elCarry = $('<div class="equipment-layer equipment-add"/>')
										.on('click', function(){
											this.selectEquipmentStart()
										}.bind(this))
					)
					.append(
						$('<div class="equipment-layer equipment-infos"/>')
							.append(
								this.elName = $('<span class="equipment-name"/>')
							)
							.append(
								this.elStar = $('<span class="equipment-star"/>').html(0)
							)
							.append(
								this.elRank = $('<span class="equipment-rank"/>')
							)
							.append(function(){
								let el = $('<span class="equipment-carry"/>').html(0)
								this.elCarry = this.elCarry.add( el )
								return el
							}.bind(this))
					)
					.append(
						$('<div class="equipment-layer equipment-options"/>')
							.append(
								this.elInputStar = $('<input/>',{
									'class':		'equipment-starinput',
									'type':			'number',
									'placeholder':	0
								}).on('input', function(){
									let value = this.elInputStar.val()
									
									if( (typeof value == 'undefined' || value === '') && this.star )
										this.star = null
									
									value = parseInt(value)
									if( !isNaN(value) && this.star != value )
										this.star = value
								}.bind(this))				
							)
							.append(
								this.elSelectRank = $('<div/>',{
									'class':	'equipment-rankselect',
									'html': 	'<span>无</span>'
								}).on('click', function(){
									if( !InfosFleet.menuRankSelect ){
										InfosFleet.menuRankSelectItems = $('<div/>')
										for(let i=0; i<8; i++){
											$('<button class="rank-' + i + '"/>')
												.html( !i ? '无' : '' )
												.on('click', function(){
													InfosFleet.menuRankSelectCur.rank = i
												})
												.appendTo(InfosFleet.menuRankSelectItems)
										}
										InfosFleet.menuRankSelect = new _menu({
											'className': 'contextmenu-infos_fleet_rank_select',
											'items': [InfosFleet.menuRankSelectItems]
										})
									}
									InfosFleet.menuRankSelectCur = this
									InfosFleet.menuRankSelect.show(this.elSelectRank)
								}.bind(this))				
							)
							.append(
								//this.elButtonInspect = $('<button class="inspect"/>').html('资料').on('click', function(){
								this.elButtonInspect = $('<button class="inspect" icon="search"/>').on('click', function(){
									if( this.id )
										_frame.infos.show('[[EQUIPMENT::' + this.id + ']]')
								}.bind(this))
							)
							.append(
								//$('<button class="change"/>').html('更变').on('click',function(){
								$('<button class="change" icon="loop"/>').on('click',function(){
									this.selectEquipmentStart()
								}.bind(this))
							)
							.append(
								$('<button class="remove"/>').html('×').on('click',function(){
									this.id = null
								}.bind(this))
							)
					)
	}
	
	// 返回页面元素
		getEl(){
			return this.el
		}
	
	// 开始选择
		selectEquipmentStart(){
			_g.log('开始选择装备')

			_frame.app_main.load_page('equipments', {
				callback_modeSelection_select: function(id){
					history.back()
					this.id = id
					this.star = 0
					this.rank = (Lockr.get( 'fleetlist-option-aircraftdefaultmax' )
									&& id
									&& $.inArray(_g.data.items[id].type, _g.data.item_type_collections[3].types) > -1
								) ? 7 : 0
					TablelistEquipments.types = []
					TablelistEquipments.shipId = null
					if( this.infosFleetShip.infosFleet )
						_frame.infos.dom.main.attr('data-theme', this.infosFleetShip.infosFleet.data['theme'])
				}.bind(this),
				callback_modeSelection_enter: function(){
					TablelistEquipments.types = _g.data.ships[this.infosFleetShip.shipId].getEquipmentTypes()
					TablelistEquipments.shipId = this.infosFleetShip.shipId
					_frame.app_main.page['equipments'].object.tablelistObj.apply_types()
				}.bind(this)
			})
		}
	
	// 获取当前状态的元数据
		getData(){
			return this.data
		}
	
	
	
	// 装备ID
		get id(){
			return this.infosFleetShip.data[2][this.index]
		}
		set id( value ){
			value = parseInt(value) || null
			//this.star = 0
			_p.tip.hide()
			this.el.removeData(['tip', 'tip-filtered'])
			
			if( value != this.infosFleetShip.data[2][this.index] )
				this.star = 0
			
			if( value && !isNaN(value) ){
				this.infosFleetShip.data[2][this.index] = value
				this.improvable = _g.data.items[value].improvable || false
				this.el.attr({
							'data-equipmentid': value,
							'data-tip':			'[[EQUIPMENT::' +value+ ']]'
						})
						.css('background-image', 'url('+_g.data.items[value]._icon+')')
				this.elName.html(_g.data.items[value]._name)
				// 如果装备为飞行器，标记样式
					if( $.inArray(_g.data.items[value].type, _g.data.item_type_collections[3].types) > -1 )
						this.el.addClass('is-aircraft')
					else
						this.el.removeClass('is-aircraft')
			}else{
				this.infosFleetShip.data[2][this.index] = null
				this.improvable = false
				this.el.removeAttr('data-equipmentId')
						.removeAttr('data-tip')
						.css('background-image', '')
						.removeClass('is-aircraft')
				this.elName.html('')
			}
			
			this.infosFleetShip.infosFleetSubFleet.summaryCalc()
			this.save()
		}
	
	// 改修星级
		get star(){
			return this.infosFleetShip.data[3][this.index]
		}
		set star( value ){
			if( this._improvable ){
				value = parseInt(value) || null
				
				if( value > 10 )
					value = 10
				
				if( value < 0 )
					value = 0
				
				if( value ){
					this.infosFleetShip.data[3][this.index] = value
					this.elInputStar.val( value )
					this.elStar.html(value)
					this.el.attr('data-star', value)
				}else{
					this.infosFleetShip.data[3][this.index] = null
					this.elInputStar.val('')
					this.elStar.html(0)
					this.el.attr('data-star', '')
				}
				
			}else{
				this.infosFleetShip.data[3][this.index] = null
				this.el.removeAttr('data-star')
			}
			this.infosFleetShip.infosFleetSubFleet.summaryCalc()
			this.save()
		}
	
	// 熟练度
		get rank(){
			return this.infosFleetShip.data[4][this.index]
		}
		set rank( value ){
			if( this.id && $.inArray(_g.data.items[this.id].type, _g.data.item_type_collections[3].types) > -1 ){
				value = parseInt(value) || null
				
				if( value > 7 )
					value = 7
				
				if( value < 0 )
					value = 0
				
				if( value ){
					this.infosFleetShip.data[4][this.index] = value
					this.el.attr('data-rank', value)
				}else{
					this.infosFleetShip.data[4][this.index] = null
					this.el.attr('data-rank', '')
				}
				
			}else{
				this.infosFleetShip.data[4][this.index] = null
				this.el.removeAttr('data-rank')
			}
			this.infosFleetShip.infosFleetSubFleet.summaryCalc()
			this.save()
		}
	
	// 搭载数 & 是否可用
		set carry(value){
			if( typeof value == 'undefined' ){
				this.el.removeAttr('data-carry')
				this.elCarry.html(0)
			}else{
				value = parseInt(value) || 0
				this.el.attr('data-carry', value)
				this.elCarry.html(value)
			}
		}
	
	// 是否可改修
		set improvable(value){
			if( !value ){
				this.el.removeAttr('data-star')
				this.elInputStar.prop('disabled', true)
								.attr('placeholder', '--')
				this._improvable = false
			}else{
				this.el.attr('data-star', '')
				this.elInputStar.prop('disabled', false)
								.attr('placeholder', '0')
				this._improvable = true
			}
		}
	
	// 保存
		save(){
			if( this._updating )
				return false
			if( this.infosFleetShip ){
				//this.infosFleetShip.data[2][this.index] = this.id
				//this.infosFleetShip.data[3][this.index] = this.star
				this.infosFleetShip.save()
			}
		}
}
