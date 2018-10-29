var gform = function(data, el){
    "use strict";
    
    //initalize form
    this.options = _.assignIn({legend: '', default:gform.default, data:'search', columns:gform.columns,name: gform.getUID(),schema:data.fields},this.opts, data);
    this.el = document.querySelector(el || data.el);
    this.on = this.events.on;
    this.trigger = this.events.trigger;
    this.debounce = this.events.debounce;
    if (typeof this.options.data == 'string'){
        this.options.data = window.location[this.options.data].substr(1).split('&').map(function(val){return val.split('=');}).reduce(function ( total, current ) {total[ current[0] ] = decodeURIComponent(current[1]);return total;}, {});
    }
    
    //set flag on all root fieldsets as a section
    if(this.options.sections){
        _.each(_.filter(this.options.schema,{type:'fieldset'}),function(item,i){
            item.index = i;
            item.section = true;
            // item.text = item.legend || item.label || i;
        return item})
    }
    
    this.trigger('initialize');

    var create = function(){
        if(this.options.clear) {
            this.el.innerHTML = gform.render(this.options.sections+'_container', this.options);
        }
    
        this.container = this.el.querySelector((el || data.el) + ' form') || this.el;
        this.rows = {};
        this.fields = _.map(this.options.schema, gform.createField.bind(this, this, this.options.data||{}, null, null))
        _.each(this.fields, gform.inflate.bind(this, this.options.data||{}))
        _.each(this.fields, function(field) {
            field.owner.events.trigger('change:' + field.name, field);
        })
        gform.instances[this.options.name] = this;
        
    }

    this.restore = create.bind(this);


 
    this.toJSON = gform.toJSON.bind(this);

    create.call(this)
    this.set = function(name,value) {
        _.find(this.fields, {name: name}).set(value);
    }.bind(this),
    this.find = function(name){
        return _.find(this.fields,{name:name})
    }.bind(this)

    this.isActive = true;
    this.active = function(){return this.isActive}

    this.destroy = function() {
		this.trigger('destroy');

		//Trigger the destroy methods for each field
		// _.each(function() {if(typeof this.destroy === 'function') {this.destroy();}});
		//Clean up affected containers
		this.el.innerHTML = "";
		// for(var i = this.fieldsets.length-1;i >=0; i--) { $(this.fieldsets[i]).empty(); }

		//Dispatch the destroy method of the renderer we used
		// if(typeof this.renderer.destroy === 'function') { this.renderer.destroy(); }

		//Remove the global reference to our form
		delete gform.instances[this.options.name];

		this.trigger('destroyed');
	};

}
//parse form values into JSON object
gform.toJSON = function(name) {
    if(typeof name == 'string' && name.length>0) {
        name = name.split('.');
        return _.find(this.fields, {name: name.shift()}).get(name.join('.'));
    }
    var obj = {};
    _.each(this.fields, function(field) {
        if(field.parsable){
            if(field.array){
                obj[field.name] = obj[field.name] || [];
                obj[field.name].push(field.get());
            }else{
                obj[field.name] = field.get();
            }
        }
    }.bind(this))
    return obj;
}
gform.m = function (l,a,m,c){function h(a,b){b=b.pop?b:b.split(".");a=a[b.shift()]||"";return 0 in b?h(a,b):a}var k=gform.m,e="";a=_.isArray(a)?a:a?[a]:[];a=c?0 in a?[]:[1]:a;for(c=0;c<a.length;c++){var d="",f=0,n,b="object"==typeof a[c]?a[c]:{},b=_.assign({},m,b);b[""]={"":a[c]};l.replace(/([\s\S]*?)({{((\/)|(\^)|#)(.*?)}}|$)/g,function(a,c,l,m,p,q,g){f?d+=f&&!p||1<f?a:c:(e+=c.replace(/{{{(.*?)}}}|{{(!?)(&?)(>?)(.*?)}}/g,function(a,c,e,f,g,d){return c?h(b,c):f?h(b,d):g?k(h(b,d),b):e?"":(new Option(h(b,d))).innerHTML}),n=q);p?--f||(g=h(b,g),e=/^f/.test(typeof g)?e+g.call(b,d,function(a){return k(a,b)}):e+k(d,g,b,n),d=""):++f})}return e}

gform.instances = {};
//creates multiple instances of duplicatable fields if input attributes exist for them
gform.inflate = function(atts, fieldIn, ind, list) {
    var newList = list;    
    if(fieldIn.array){
        newList = _.uniqBy(newList,'name');
    }
    var field = _.findLast(newList, {name: newList[ind].name});
    if(!field.array && field.fields){
        _.each(field.fields, gform.inflate.bind(this, atts[field.name] || {}) );
    }
    if(field.array) {
        var count = field.array.min||0;
        if((typeof atts[field.name] == 'object' && atts[field.name].length > 1)){
            if(atts[field.name].length> count){count = atts[field.name].length}
        }
        for(var i = 1; i<count; i++) {
            var newfield = gform.createField.call(this, field.parent, atts, field.el, i, field.item);
            field.parent.fields.splice(_.findIndex(field.parent.fields, {id: field.id})+1, 0, newfield)
            field = newfield;
        }
        
    }
}

gform.createField = function(parent, atts, el, index, fieldIn ) {
    fieldIn.type = fieldIn.type || this.options.default.type;
    //work gform.default in here
    var field = _.assignIn({
        name: (fieldIn.label||'').toLowerCase().split(' ').join('_'), 
        id: gform.getUID(), 
        // type: 'text', 
        label: fieldIn.legend || fieldIn.name,
        validate: {},
        valid: true,
        parsable:true,
        visible:true,
        enabled:true,
        parent: parent,
        array:false,
        columns: this.options.columns,
        offset: 0,
        ischild:!(parent instanceof gform)        
    }, this.opts,gform.default,gform.types[fieldIn.type].defaults, fieldIn)
    field.validate.required = field.validate.required|| field.required;
    
    if(field.name == ''){field.name = field.id;}
    field.item = fieldIn;
    field.owner = this;
	if(field.columns > this.options.columns) { field.columns = this.options.columns; }
    
    if(field.array && typeof atts[field.name] == 'object'){
        field.value =  atts[field.name][index||0];
    }else{
        field.value =  atts[field.name] || field.value;
    }

	if(field.item.value !== 0){
        if(field.array && typeof atts[field.name] == 'object'){
            field.value =  atts[field.name][index||0];
        }else{
            if(typeof field.item.value === 'function') {
                //uncomment this when ready to test function as value for input
                field.valueFunc = field.item.value;
                field.derivedValue = function() {
                    return field.valueFunc.call(field, field.owner.toJSON());
                };
                field.item.value = field.item.value = field.derivedValue();
                field.owner.on('change', function(){
                    this.set.call(this,this.derivedValue());
                }.bind(field));
            } else {
                //may need to search deeper in atts?
                field.value =  atts[field.name] || field.value || '';
            }  
        }
	} else {
		field.value = 0;
	}

    field.satisfied = field.satisfied || gform.types[field.type].satisfied.bind(field);
    field.update = gform.types[field.type].update.bind(field);
    field.destroy = gform.types[field.type].destroy.bind(field);
    
    field.active = function() {
		return this.parent.active() && this.enabled && this.parsable && this.visible;
	}
    field.set = function(value, silent){
        //not sure we should be excluding objects - test how to allow objects
        if(this.value != value && typeof value !== 'object') {
            this.value = value;
            gform.types[this.type].set.call(this,value);
			if(!silent){this.owner.trigger('change');this.owner.trigger('change:'+this.name)};
		}
    }.bind(field)

    field.get = field.get || gform.types[field.type].get.bind(field);
    
    field.render = field.render || gform.types[field.type].render.bind(field);
    
    field.el = gform.types[field.type].create.call(field);

    field.container =  field.el.querySelector('fieldset') || null;

    if(!field.target && (this.options.clear || field.isChild)){
        var cRow;
        // cRow = field.owner.rows[field.owner.rows.length-1];
        var formRows = field.parent.container.querySelectorAll('form > .'+field.owner.options.rowClass+',fieldset > .'+field.owner.options.rowClass);
        var temp =(formRows[formRows.length-1] || {}).id;
        if(typeof temp !== 'undefined') {
            cRow = field.parent.rows[temp];	
        }
        if(typeof cRow === 'undefined' || (cRow.used + parseInt(field.columns,10) + parseInt(field.offset,10)) > this.options.columns || field.row == true){
            var temp = gform.getUID();
            cRow = {};
            cRow.used = 0;
            cRow.ref  = document.createElement("div");
            cRow.ref.setAttribute("id", temp);
            cRow.ref.setAttribute("class", field.owner.options.rowClass);
            field.parent.rows[temp] = cRow;
            field.parent.container.appendChild(cRow.ref);
        }
        cRow.used += parseInt(field.columns, 10);
        cRow.used += parseInt(field.offset, 10);
        cRow.ref.appendChild(field.el);
        field.row = temp;
    }else{
        if(!field.target){
            field.target = '[name="'+field.name+'"]';
        }
        var temp = this.container.querySelector(field.target)
        if(typeof temp !== 'undefined' && temp !== null    ){
            temp.appendChild(field.el);
        }
       
    }
    // }
    // else{
    //         field.rows = {};

    //     if (el == null){
    //         field.parent.container.appendChild(field.el);
    //     } else {
    //         field.parent.container.insertBefore(field.el, el.nextSibling);
    //     }
    // }


    gform.types[field.type].initialize.call(field);

    var add = field.el.querySelector('.gform-add');
    if(add !== null){
        add.addEventListener('click', function(field){
            if(_.countBy(field.parent.fields, {name: field.name}).true < (field.array.max || 5)){
                var index = _.findIndex(field.parent.fields,{id:field.id});
                var atts = {};
                // atts[field.name] = field.value;
                var newField = gform.createField.call(this, field.parent, atts, field.el ,null, field.item);
                field.parent.fields.splice(index+1, 0, newField)
                newField.el.querySelector('[name="'+field.name+'"]').focus();

                _.each(['change', 'change:'+field.name, 'create:'+field.name, 'inserted:'+field.name], function(event){field.owner.trigger(event,field.owner,field)}.bind(field))
            }
        }.bind(this, field));
    }
    var minus = field.el.querySelector('.gform-minus');
    if(minus !== null){
        minus.addEventListener('click', function(field){
            if(_.countBy(field.parent.fields, {name: field.name}).true > (field.array.min || 1)){
                var index = _.findIndex(field.parent.fields,{id:field.id});
                field.parent.fields.splice(index, 1);
                if(!field.target){
                    field.parent.rows[field.row].used -= (field.offset + field.columns)
                    field.parent.rows[field.row].ref.removeChild(field.el);
                    if(field.parent.rows[field.row].used  == 0){
                        field.parent.container.removeChild(field.parent.rows[field.row].ref);
                        delete field.parent.rows[field.row];
                    }else{
                        gform.types[field.parent.type].reflow.call(field.parent);
                    }
                }else{
                    this.container.querySelector(field.target).removeChild(field.el);
                }
                _.each(['change', 'change:'+field.name, 'removed:'+field.name], function(event){field.owner.trigger(event,field.owner,field)}.bind(field))
            }else{
                field.set(null);
            }
        }.bind(this, field));
    }
    if(field.fields){
        var newatts = {};
            if(field.array && typeof atts[field.name] == 'object'){
                newatts =  atts[field.name][index||0];
            }else{
                newatts = atts[field.name]||{};
            }

            field.fields = _.map(field.fields, gform.createField.bind(this, field, newatts, null, null) );
                 if(field.array){
                    _.each(field.fields, gform.inflate.bind(this, newatts) );
                }
        
    }

    gform.processConditions.call(field, field.display, function(result){
        this.el.style.display = result ? "block" : "none";
        this.visible = result;        
    })      
    // gform.processConditions.call(field, field.visible, function(result){
    //     this.el.style.visibility = result ? "visible" : "hidden";
    //     this.visible = result;
    // })
    
    gform.processConditions.call(field, field.enable, function(result){
        this.enabled = result;        
        gform.types[this.type].enable.call(this,this.enabled);
    })
    gform.processConditions.call(field, field.parse, function(result){
        this.parsable = result
    })
    gform.processConditions.call(field, field.validate.required, function(result){
        this.validate.required = result
        this.update();
    })

    return field;
}

// gform.update = function(field){
//     field.el.innerHTML = gform.types[field.type].render.call(field);
//     var oldDiv = document.getElementById(field.id);
//     if(oldDiv == null){
//         // oldDiv.parentNode.appendChild(field.el, oldDiv);
        
//     }else{
//         oldDiv.parentNode.replaceChild(field.el, oldDiv);
//     }
// }

gform.ajax = function(options){
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if(request.readyState === 4) {
            if(request.status === 200) { 
                options.success(JSON.parse(request.responseText));
            } else {
                console.log(request.responseText);
                // options.error(request.responseText);
            } 
        }
    }
    request.open(options.verb || 'GET', options.path);
    request.send();
}

gform.default ={type:'text',format:{label: '{{label}}', value: '{{value}}'}} 
gform.prototype.opts = {
    clear:true,
    sections:'',
    suffix: ':',
    rowClass: 'row',
    requiredText: '<span style="color:red">*</span>'
}

 //  var temp = {
  //   options:{
  //    options:[],
  //    url:"",
  //   //  function(){},
  //    sections:[
  //      {
  //       label:"",
  //       format:{
  //         label:"{{label}}",
  //         value:"{{value}}",
  //       },
  //       url:"",
  //       min:null,
  //       max:null,
  //       step:1,
  //       options:[],
  //       "display": {
  //         "matches": [
  //           {"name": "f_n","value":["", "tim"]},
  //         ],
  //       } 
  //       "enabled": {
  //         "matches": [
  //           {"name": "f_n","value":["", "tim"]},
  //         ],
  //       }
  //      }
  //    ]
  //  }
  // }

gform.optionsObj = function(opts,value,count){

	// If max is set on the field, assume a number set is desired. 
	// min defaults to 0 and the step defaults to 1.
	if(typeof opts.max !== 'undefined') {
        for(var i = (opts.min || 0);i<=opts.max;i=i+(opts.step || 1)){
            opts.options.push(""+i);
        }
    }
    return _.map(opts.options, function(item, i){
        if(typeof item === 'string' || typeof item === 'number') {
            item = {label: item, value:item};
        }
        item.index = item.index || ""+(count+i);
        _.assignIn(item,{label: gform.renderString(this.format.label,item), value: gform.renderString(this.format.value,item) });
        if(item.value == value) { item.selected = true;}
        return item;
    }.bind(opts))
}

/* Process the options of a field for normalization */
gform.options = function(opts, value, count) {
    count = count||0;
    var newOpts = {options:[]};
    if(typeof opts == 'object' && !_.isArray(opts)){
        _.merge(newOpts, opts);    
    }
    
    if(typeof opts == 'function') {
        newOpts.action = opts;
        opts.options = newOpts.action.call(this);
    }

	if(typeof opts == 'string' || typeof newOpts.url == 'string') {
        newOpts.path = opts.url || opts;
        newOpts.options = false;
        newOpts.url = null;
        gform.ajax({path: newOpts.path, success:function(data) {
            this.options.options = data;  
            this.options = gform.options.call(this,this.options,this.value);
            // gform.update(field)
            this.update()
        }.bind(this)})
        // field.options = newOpts;
		return newOpts;
    }

    if(_.isArray(opts)){
        opts = _.merge({options:[]}, gform.default, {options:opts});        
    }else{
        opts = _.merge({options:[]}, gform.default, opts);        
    }

    // if(typeof field.default !== 'undefined' && field.options[0] !== field.default) {
	// 	field.options.unshift(field.default);
    // }

    newOpts.options =  gform.optionsObj(opts,value,count);
    if(_.isArray(opts.optgroups)){
        count = count||(newOpts.options.length-1);
        _.each(opts.optgroups,function(section){
            // var section = gform.options.obj.call(this,section,this.value,count);
            section.options = gform.optionsObj( _.merge({options:[]},gform.default, section),value,count);
            section.id = gform.getUID();
            newOpts.options.push({"section":section});

            gform.processConditions.call(this, section.enable, function(id, result){
                var op = this.el.querySelectorAll('[data-id="'+id+'"]');
                for (var i = 0; i < op.length; i++) {
                      op[i].disabled = !result;
                  }
            }.bind(this,section.id))            
            gform.processConditions.call(this, section.display, function(id, result){
                var op = this.el.querySelectorAll('[data-id="'+id+'"]');
                for (var i = 0; i < op.length; i++) {
                      op[i].hidden = !result;
                  }
            }.bind(this,section.id))

            count += section.options.length;
        }.bind(this))
    }
    if(typeof opts.placeholder == 'string'){
        newOpts.options.unshift({label:opts.placeholder, value:'',enabled:false,visible:false,selected:true})
    }
    return newOpts;
}








gform.VERSION = '0.0.0.2';
gform.i = 0;
gform.getUID = function() {
    return 'f' + (gform.i++);
};

gform.types = {
    'input':{
        defaults:{},
        create: function(){
            var tempEl = document.createElement("span");
            tempEl.setAttribute("id", this.id);
            // tempEl.setAttribute("data-columns", this.columns);
            tempEl.setAttribute("class", ' '+gform.columnClasses[this.columns]);
            tempEl.innerHTML = this.render();
            return tempEl;
        },
        render: function(){
            return gform.render(this.type, this);
        },
        destroy:function(){
            this.el.removeEventListener('change',this.onchangeEvent );		
            this.el.removeEventListener('change',this.onchange );		
            this.el.removeEventListener('input', this.onchangeEvent);
        },
        initialize: function(){
            if(this.onchange !== undefined){ this.el.addEventListener('change', this.onchange);}
            this.onchangeEvent = function(){
                this.value = this.get();
                this.owner.events.trigger('change:'+this.name, this);
                this.owner.events.trigger('change', this);
            }.bind(this)
            this.el.addEventListener('change',this.onchangeEvent );		
            this.el.addEventListener('input', this.onchangeEvent);
        },
        update: function(item, silent) {
            if(typeof item === 'object') {
                _.extend(this, this.item, item);
            }
            
            var oldDiv = document.getElementById(this.id);

            this.destroy();
            this.el = gform.types[this.type].create.call(this);
            oldDiv.parentNode.replaceChild(this.el,oldDiv);
            gform.types[this.type].initialize.call(this);

            if(!silent) {
                this.owner.trigger('change:'+this.name, this);
                this.owner.trigger('change',this);
            }
        },
        get: function(){
            return this.el.querySelector('input[name="' + this.name + '"]').value;
        },
        set: function(value){
            this.el.querySelector('input[name="' + this.name + '"]').value = value;
        },
        satisfied: function(value){
            return (typeof value !== 'undefined' && value !== null && value !== '');            
        },
        enable: function(state){
            this.el.querySelector('input').disabled = !state;            
        }
        //display
    },
    'textarea':{
        defaults:{},
        set: function(value){
            this.el.querySelector('textarea[name="' + this.name + '"]').innerHTML = value;
        },
        get: function(){
            return this.el.querySelector('textarea[name="' + this.name + '"]').value;
        }
    },
    'bool':{
        defaults:{options:[false, true]},
        render: function(){
            this.selected = (this.value == this.options[1]);
            return gform.render(this.type, this);
        },
        set: function(value){
            this.selected = (value == this.options[1]);
            this.el.querySelector('input[name="' + this.name + '"]').checked = this.selected;
        },
        get: function(){
            return this.options[this.el.querySelector('input[name="' + this.name + '"]').checked?1:0]
        }
    },
    'collection':{
        render: function(){
            this.options = gform.options.call(this,this.options, this.value);
            return gform.render(this.type, this);
        },
        initialize: function(){
            if(this.onchange !== undefined){ this.el.addEventListener('change', this.onchange);}
            this.el.addEventListener('change', function(){
                this.value = this.get();
                this.owner.events.trigger('change:'+this.name, this);
                this.owner.events.trigger('change', this);
            }.bind(this));		
        },
        get: function(){
            return this.el.querySelector('select[name="' + this.name + '"]').value;
        },
        set: function(value){
            this.el.querySelector('[name="' + this.name + '"]').value = value;
            _.each(this.options.options, function(option, index){
                if(option.value == value || parseInt(option.value) == parseInt(value)) this.el.querySelector('[name="' + this.name + '"]').selectedIndex = index;
            }.bind(this))
        }
    },
    'section':{
        initialize: function(){
            //handle rows
            this.rows = {};
        },        
        render: function(){
            if(this.owner.options.sections){
                return gform.render(this.owner.options.sections+'_fieldset', this);                
            }else{
                return gform.render('_fieldset', this);                
            }
        },
        get: function(name){
            return gform.toJSON.call(this,name)
        },
        reflow: function(){
            _.each(this.fields,function(field){
                debugger;
            }.bind(this.rows))
        }
    }
};
gform.render = function(template, options){
    return gform.m(gform.stencils[template||'text'] || gform.stencils['text'],_.extend({},gform.stencils,options))
}
gform.renderString = function(string,options){
    return gform.m(string||'',options||{})
}

gform.types['text']     = gform.types['number'] = gform.types['color'] = gform.types['input'];
gform.types['hidden']   = _.extend({}, gform.types['input'], {defaults:{columns:0}});
gform.types['textarea'] = _.extend({}, gform.types['input'], gform.types['textarea']);
gform.types['checkbox'] = _.extend({}, gform.types['input'], gform.types['bool']);
gform.types['fieldset'] = _.extend({}, gform.types['input'], gform.types['section']);
gform.types['select']   = _.extend({}, gform.types['input'], gform.types['collection']);
gform.types['radio']    = _.extend({}, gform.types['input'], gform.types['collection'], {
    get: function(){
        return (this.el.querySelector('[type="radio"][name="' + this.name + '"]:checked')||{value:''}).value; 
    },
    set:function(value){

        this.el.querySelector('[value="'+value+'"]').checked = 'checked'
        
    }
});

gform.types['email'] = _.extend({},gform.types['input'],{defaults:{validate: { 'valid_email': true }}});