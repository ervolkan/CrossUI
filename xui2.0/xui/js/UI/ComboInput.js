Class("xui.UI.ComboInput", "xui.UI.Input",{
    /*Instance*/
    Instance:{
        _adjustV:function(v){
            var profile=this.get(0),p=profile.properties;
            if(profile.$isNumber){
                v=(''+v).replace(/[^\d.-]/g,'');
                v=xui.isNumb(parseFloat(v))?xui.toFixedNumber(v,p.precision):null;
            }else if(profile.properties.type=='date'||profile.properties.type=='datetime'){
                v=xui.isDate(v)?v:xui.isFinite(v)?new Date(parseInt(v,10)):null;                
            }else if(typeof v=="string" && v.indexOf("\r")!=-1){
                v=v.replace(/(\r\n|\r)/g, "\n");
            }
            return v;
        },
        getValue:function(){
            var upper=arguments.callee.upper,
                v = upper.apply(this,xui.toArr(arguments));
            upper=null;
            return this._adjustV(v);
        },
        getUIValue:function(){
            var upper=arguments.callee.upper,
                v = upper.apply(this,xui.toArr(arguments));
            upper=null;
            return this._adjustV(v);
        },
        _getCtrlValue:function(){
            return this.get(0).properties.$UIvalue;
            //return this._fromEditor(this.getSubNode('INPUT').attr('value'));
        },
        _setCtrlValue:function(value){
            var ns=this,me=arguments.callee, r1=me._r1||(me._r1=/\</),r2=me._r2||(me._r2=/\<\/?[^>]+\>/g);
            return this.each(function(profile){
                if(!profile.$typeOK)
                    profile.box._iniType(profile);
                var o=profile.getSubNode('INPUT'), type=profile.properties.type;

                value=profile.$_onedit
                    // for enter/esc key, show editMode value
                    ? ns._toEditor(value)
                    : ns.getShowValue(value);

                if(type!=='none'&& type!=='input'&& type!=='password' && !profile.properties.multiLines && typeof value=='string' && r1.test(value))value=value.replace(r2,'');
                
                if(profile.$Mask && !value){
                    value=profile.$Mask;
                }
                profile.$_inner=1;
                o.attr('value',value||'');
                delete profile.$_inner;
                if(type=='color')
                    o.css({backgroundColor:value, color:xui.UI.ColorPicker.getTextColor(value)});
            })
        },
        _compareValue:function(v1,v2){
            var profile=this.get(0),t;
            if(t= profile.CF.compareValue||profile.$compareValue)
                return t(profile, v1, v2);

            return v1===v2;
        },
        getShowValue:function(value){
            var profile=this.get(0),
                pro=profile.properties,v,t;
            if(!xui.isDefined(value))
                value=pro.$UIvalue;

            // try to give default caption
            if(t = profile.CF.getShowValue||profile.$getShowValue)
                v = t(profile, value);
            else{
                //get from items
                if('listbox'==pro.type){
                    var list = (pro.listKey)?xui.UI.getCachedData(pro.listKey):pro.items;
                    if( list && (t=xui.arr.subIndexOf(list,'id',value))!=-1){
                      v=list[t].caption+"";
                      if(v && v.length>0)v=xui.adjustRes(v);
                    }else
                        v=null;
                }else
                    v=profile.$showValue;
            }
            if(!xui.isSet(v) && (profile.$inputReadonly || pro.inputReadonly))
                v=xui.isSet(pro.caption)?pro.caption:null;
            return ""+( xui.isSet(v) ? v : xui.isSet(value) ? value : "");
        },
        _toEditor:function(value){
            var profile=this.get(0),
                pro=profile.properties,t;
                if(t= profile.CF.toEditor||profile.$toEditor)
                    return t(profile, value);
            return value;
        },
        _fromEditor:function(value){
            var profile=this.get(0),
                pro=profile.properties,t;

                if(t= profile.CF.fromEditor||profile.$fromEditor)
                    return t(profile, value);
            return value;
        },
        _cache:function(type, focus){
            if(this.isDestroyed())return ;
            var profile=this.get(0);
            
            var drop=profile.$drop, cached=profile.properties.cachePopWnd;
            if(drop){
                if(!cached){
                    if(!drop.destroyed)
                        drop.boxing().destroy(true);
                    delete profile.$drop;
                    if(focus)
                        profile.boxing().activate();
                }else{
                    if(!profile.__tryToHide){
                        profile.__tryToHide= xui.asyRun(function(){
                            // destroyed
                            if(!profile.box)return;
                            delete profile.__tryToHide;

                            if(!drop.destroyed){
                                if(xui.browser.opr)
                                    drop.getRoot().css('display','none');
                                if(drop.boxing()._clearMouseOver)drop.boxing()._clearMouseOver();
                                profile.getSubNode('POOL').append(drop.getRoot());
                            }                            
                            if(focus)
                                profile.boxing().activate();
                        });
                    }
                }
            }
            delete profile.$poplink;

            if(profile.afterPopHide)
                this.afterPopHide(profile, drop, type);
            return cached;
        },
        clearPopCache:function(){
            var profile=this.get(0);
            if(profile.renderId)
                profile.getSubNode('POOL').empty();
            delete profile.$drop;
            return this;
        },
        setUploadObj:function(input){
            var profile=this.get(0),
                prop=profile.properties,
                c = xui(input).get(0);
            if(c.tagName && c.tagName.toLowerCase()=='input' && c.type=='file'){
                if(profile.renderId && prop.type=='file'){
                    var o = profile.getSubNode('FILE').get(0);
                    
                    xui.setNodeData(c.$xid=o.$xid,'element',c);
                    c.id=o.id;
                    c.onclick=o.onclick;
                    c.onchange=o.onchange;
                    o.$xid=null;                
                    o.id=o.onclick=o.onchange=null;
                    //a special node, must delete if from cache here:
                    delete profile.$_domid[profile.keys['FILE']];
                    xui([o]).addPrev(c).remove(false);
                    this.setUIValue(c.value||"",null,null,'setfile');
                }
            }
            return this;
        },
        //for upload ,special must get the original node
        getUploadObj:function(){
            var profile=this.get(0),prop=profile.properties;
            if(profile.renderId && prop.type=='file'){
                var o = profile.getSubNode('FILE').get(0);
                if(!o.value)
                    return null;
                    
                var c=o.cloneNode(false);
                c.value="";
                //inner replace
                xui.setNodeData(c.$xid=o.$xid,'element',c);
                c.onclick=o.onclick;
                c.onchange=o.onchange;

                //remove those
                //if(xui.browser.ie)
                //    o.removeAttribute('$xid');
                //else
                //    delete o.$xid;
                //**: "removeAttribute" doesn't work in IE9+
                o.$xid=null;
                
                o.id=o.onclick=o.onchange=null;

                //a special node, must delete if from cache here:
                delete profile.$_domid[profile.keys['FILE']];
                xui([o]).addPrev(c).remove(false);
                c=null;

                this.setUIValue(this.getValue(),null,null,'getfile');

                return o;
            }
        },
        popFileSelector:function(){
            var profile=this.get(0),prop=profile.properties;
            if(profile.renderId && prop.type=='file'){
                var fileInput = profile.getSubNode('FILE').get(0);
                // for IE11
                if (xui.browser.ie11)  {
                  var label=document.createElement( "div");
                  fileInput.appendChild(label);
                  label.click();
                  fileInput.removeChild(label);
                }else{
                  fileInput.click();
                }
            }
        },
        resetValue:function(value){
            this.each(function(p){
                if(p.properties.type=='file')
                    p.getSubNode('FILE').attr('value','');
            });
            var upper=arguments.callee.upper,
                rtn=upper.apply(this,xui.toArr(arguments));
            upper=null;
            return rtn;
        },
        _drop:function(e,src){
            return this.each(function(profile){
                var pro = profile.properties, type=pro.type, cacheDrop=pro.cachePopWnd;
                if(pro.disabled||pro.readonly)return;

                //open already
                if(profile.$poplink)return;
                var o, v,
                    box = profile.boxing(),
                    main = profile.getSubNode('BOX'),
                    btn = profile.getSubNode('BTN'),
                    pos = main.offset();
                pos.top += main.offsetHeight();

                //special cmd type: getter, 'cmdbox' and 'popbox'
                if((profile.beforeComboPop && false===(profile.$drop = box.beforeComboPop(profile, pos, e, src))))
                    return;

                // for standard drop
                if(type=='combobox'||type=='listbox'||type=='helpinput'
                    ||type=='date'
                    ||type=='time'
                    ||type=='datetime'
                    ||type=='color'){

                    if(profile.__tryToHide){
                        xui.clearTimeout(profile.__tryToHide);
                        delete profile.__tryToHide;
                    }

                    //get cache key
                    var cachekey;
                    if(cacheDrop){
                        switch(type){
                            case 'time':
                            case 'date':
                            case 'datetime':
                            case 'color':
                                cachekey=type;
                                break;
                            default:
                                if(pro.listKey)
                                    //function no cache
                                    if(typeof xui.get(xui.$cache,['UIDATA', pro.listKey])=='function')
                                        profile.$drop = cachekey = null;
                                    else
                                        cachekey = "!"+pro.listKey;
                                else
                                    cachekey = "$"+profile.$xid;
                        }
                        //get from global cache
                        if(cachekey){
                            //filter first
                            xui.filter(profile.box.$drop,function(o){
                                return !!o.renderId;
                            });
                            profile.$drop = profile.box.$drop[cachekey];
                        }
                    }

                    //cache pop
                    if(!profile.$drop){
                        switch(type){
                            case 'combobox':
                            case 'listbox':
                            case 'helpinput':
                                o = xui.create('List');
                                o.setHost(profile).setDirtyMark(false).setItems(xui.copy(pro.items)).setListKey(pro.listKey||'');
                                if(pro.dropListWidth) o.setWidth(pro.dropListWidth);
                                else o.setWidth(profile.$forceu( main.offsetWidth() + btn.offsetWidth() ));

                                o.setHeight(pro.dropListHeight||'auto');

                                o.afterClick(function(){
                                    if(!this.destroyed)
                                        this.boxing()._cache('',true);
                                    else
                                        o.destroy(true);
                                    return false;
                                });
                                o.beforeUIValueSet(function(p, ovalue, value){
                                    var b2=this.boxing();
                                    if(type=='combobox'){
                                        var item=p.queryItems(p.properties.items,function(o){return o.id==value},false,true);
                                        if(item.length)
                                            value = item[0].caption;
                                    }
                                    //update value
                                    b2.setUIValue(value,null,null,'pick');

                                    //cache pop
                                    return b2._cache('',true);
                                });
                                break;
                            case 'time':
                                o = xui.create('TimePicker');
                                o.setHost(profile);
                                o.beforeClose(function(){
                                   if(!this.destroyed)
                                        this.boxing()._cache('',true);
                                    return false
                                });
                                o.beforeUIValueSet(function(p, o, v){
                                    var b2=this.boxing();
                                    //update value
                                    b2.setUIValue(v,null,null,'pick');
                                    return b2._cache('',true);
                                });
                                break;
                            case 'date':
                            case 'datetime':
                                o = xui.create('DatePicker');

                                if(type=='datetime')
                                    o.setTimeInput(true);

                                o.setHost(profile);
                                o.beforeClose(function(){
                                    if(!this.destroyed)
                                        this.boxing()._cache('',true);
                                    else
                                        o.destroy(true);
                                    return false
                                });
                                o.beforeUIValueSet(function(p, o, v){
                                    var b2=this.boxing();
                                    //update value
                                    b2.setUIValue(String(v.getTime()),null,null,'pick');
                                    return b2._cache('',true);
                                });

                                break;
                            case 'color':
                                o = xui.create('ColorPicker');
                                o.setHost(profile);
                                o.beforeClose(function(){
                                    if(!this.destroyed)
                                        this.boxing()._cache('',true);
                                    else
                                        o.destroy(true);
                                    return false
                                });
                                o.beforeUIValueSet(function(p, o, v){
                                    var b2=this.boxing();
                                    //update value
                                    b2.setUIValue((v=='transparent'?'':'#')+v,null,null,'pick');
                                    return b2._cache('',true);
                                });
                                break;
                        }
                        if(xui.isHash(pro.popCtrlProp) && !xui.isEmpty(pro.popCtrlProp))
                            o.setProperties(pro.popCtrlProp);
                        if(xui.isHash(pro.popCtrlEvents) && !xui.isEmpty(pro.popCtrlEvents))
                            o.setEvents(pro.popCtrlEvents);

                        profile.$drop = o.get(0);

                        //set to global cache
                        if(cachekey)
                            profile.box.$drop[cachekey]=profile.$drop;

                        o.render();
                    }

                    o=profile.$drop.boxing();
                    o.setHost(profile);

                    //set pop
                    switch(type){
                        case 'combobox':
                        case 'listbox':
                        case 'helpinput':
                        case 'time':
                            o.setValue(profile.properties.$UIvalue, true,'pop');
                            break;
                        case 'date':
                        case 'datetime':
                            var t = profile.$drop.properties;
                            if(t=profile.properties.$UIvalue)
                                o.setValue(new Date( parseInt(t,10)), true,'pop');
                            break;
                        case 'color':
                            o.setValue(profile.properties.$UIvalue.replace('#',''), true,'pop');
                            break;
                    }

                    profile.$poplink = o.get(0);

                    if(profile.beforePopShow && false===box.beforePopShow(profile, profile.$drop))
                        return;
                    //pop
                    var node=o.reBoxing();
                    node.popToTop(profile.getSubNode('BOX'));

                    xui.tryF(o.activate,[],o);

                    //for on blur disappear
                    node.setBlurTrigger(profile.key+":"+profile.$xid, function(){
                        box._cache('blur');
                    });

                    //for esc
                    xui.Event.keyboardHookUp('esc',0,0,0,function(){
                        profile.$escclosedrop=1;
                        xui.asyRun(function(){
                            delete profile.$escclosedrop;
                        });

                        box.activate();
                        //unhook
                        xui.Event.keyboardHook('esc');
                        box._cache('esc',true);
                    });
                }

                if(profile.afterPopShow)
                    box.afterPopShow(profile, profile.$drop);
            });
        },
        expand:function(){
            var profile=this.get(0);
            if(profile.renderId)
                profile.boxing()._drop();
        },
        collapse:function(){
            var profile=this.get(0);
            if(profile.renderId && profile.$poplink)
                profile.boxing()._cache('call');
        },
        getPopWnd:function(force){
            var profile=this.get(0);
            if(profile && profile.$drop && (force||profile.$poplink))
                return profile.$drop.boxing();
        }
    },
    /*Initialize*/
    Initialize:function(){
        this.addTemplateKeys(['FILE','BTN','MID','RBTN','R1','R1B','R2','R2B']);
        //modify default template for shell
        var t = this.getTemplate();
        xui.merge(t.FRAME.BORDER,{
            SBTN:{
                $order:50,
                tagName:'button',
                className:'xui-ui-unselectable xui-uiborder-radius-tr xui-uiborder-radius-br xui-nofocus xui-ui-btn',
                style:"{_cmdDisplay}",
                SMID:{
                    className:"xuifont {btncls}",
                    $fonticon:'{_fi_commandCls}'
                }
            }
        },'all');
        t.FRAME.BORDER.BOX.className='xui-ui-input xui-ui-shadow-input xui-uiborder-flat {_radius_input} xui-uibase';
        t.FRAME.POOL={};
        t.className +=' {typecls}';

        this.setTemplate(t);

        this._adjustItems=xui.absList._adjustItems;
        this.prototype.getItems=xui.absList.prototype.getItems;
    },
    Static:{
        _beforeResetValue:function(profile){
            profile.properties.caption=undefined;
        },
        _iniType:function(profile){
            var pro=profile.properties, type=pro.type, c=profile.box;
            delete profile.$beforeKeypress;
            delete profile.$inputReadonly;
            delete profile.$isNumber;
            delete profile.$compareValue;
            delete profile.$getShowValue;
            delete profile.$toEditor;
            delete profile.$fromEditor;
            delete profile.$typeOK;

            if(type=='listbox'||type=='file'||type=='cmdbox'||type=='button'||type=='dropbutton')
                profile.$inputReadonly=true;

            if(type=='file')
                profile.$xuiFileCtrl=true;

            if(type!='listbox' && type!='combobox' && type!='helpinput')
                pro.items=[];

            if(type=='time'){
                var keymap={a:1,c:1,v:1,x:1};
                xui.merge(profile,{
                    $beforeKeypress : function(p,c,k){
                        return k.key.length!=1 || /[-0-9:]/.test(k.key)|| (k.ctrlKey&& !!keymap[k.key]);
                    },
                    $getShowValue : function(p,v){
                        return v?xui.UI.TimePicker._ensureValue(p,v):'';
                    },
                    $fromEditor : function(p,v){
                        if(v){
                            v = xui.UI.TimePicker._ensureValue(p,v);
                            if(v=='00:00')v=p.properties.$UIvalue;
                        }
                        return v;
                    }
                },'all');
            }else if(type=='date' || type=='datetime'){
                var date=xui.Date;
                var keymap={a:1,c:1,v:1,x:1};
                xui.merge(profile,{
                    $beforeKeypress : function(p,c,k){
                        return k.key.length!=1 || /[0-9:/\-_ ]/.test(k.key) ||(k.ctrlKey && !!keymap[k.key]);
                    },
                    $compareValue : function(p,a,b){
                        return (!a&&!b) || (String(a)==String(b))
                    },
                    $getShowValue : function(p,v){
                        if(p.properties.dateEditorTpl)
                            return v?date.format(v, p.properties.dateEditorTpl):'';
                        else
                            return v?date.getText(new Date(parseInt(v,10)), p.properties.type=='datetime'?'ymdhn':'ymd'):'';
                    },
                    $toEditor : function(p,v){
                        if(!v)return "";

                        v=new Date(parseInt(v,10)||0);
                        if(p.properties.dateEditorTpl)
                            return date.format(v, p.properties.dateEditorTpl);
                        else{
                            var m=(date.get(v,'m')+1)+'',d=date.get(v,'d')+'',h=date.get(v,'h')+'',n=date.get(v,'n')+'';
                            return date.get(v,'y')+'-'+(m.length==1?'0':'')+m+'-'+(d.length==1?'0':'')+d 
                            
                              +(p.properties.type=='datetime'?(" "+(h.length==1?'0':'')+h +":" +(n.length==1?'0':'')+n):"");
                        }
                    },
                    $fromEditor : function(p,v){
                        if(v){
                            if(p.properties.dateEditorTpl)
                                v=date.parse(v, p.properties.dateEditorTpl);
                            else
                                v=xui.Date.parse(v);
                            // set to old UIvalue
                            if(!v){
                                v=p.properties.$UIvalue;
                                if(xui.isFinite(v))v=new Date(parseInt(v,10));
                            }
                            if(v){
                                if(p.properties.type!='datetime')
                                    v=date.getTimSpanStart(v,'d',1);
                                // min/max year
                                if(v.getFullYear()<p.properties.min)
                                    v.setTime(p.properties.min);
                                if(v.getFullYear()>p.properties.max)
                                    v.setTime(p.properties.max);
                            }
                        }
                        return v?String(v.getTime()):'';
                    }
                },'all');
            }else if(type=='currency'){
                profile.$isNumber=1;
                var keymap={a:1,c:1,v:1,x:1};
                xui.merge(profile,{
                    $beforeKeypress : function(p,c,k){
                        return k.key.length!=1 || /[-0-9,. ]/.test(k.key) ||(k.ctrlKey && !!keymap[k.key]);
                    },
                    $compareValue : function(p,a,b){
                        return ((a===''&&b!=='')||(b===''&&a!==''))?false:p.box._number(p, a)==p.box._number(p, b)
                    },
                    $getShowValue : function(p,v){
                        var pp=p.properties;
                        if(xui.isSet(v)&&v!==""){
                            v=xui.formatNumeric(p.box._number(p, v), pp.precision, pp.groupingSeparator, pp.decimalSeparator, pp.forceFillZero);
                            if(p.properties.currencyTpl)
                                v=p.properties.currencyTpl.replace("*", v);
                        }else
                            v="";
                        return v;
                    },
                    $toEditor : function(p,v){
                        var pp=p.properties;
                        return (xui.isSet(v)&&v!=="")?xui.formatNumeric(p.box._number(p, v), pp.precision, pp.groupingSeparator, pp.decimalSeparator, pp.forceFillZero):"";
                    },
                    $fromEditor : function(p,v){
                        return (xui.isSet(v)&&v!=="")?p.box._number(p, v):"";
                    }
                },'all');
            }else if(type=='number' || type=='spin'){
                profile.$isNumber=1;
                var keymap={a:1,c:1,v:1,x:1};
                xui.merge(profile,{
                    $beforeKeypress : function(p,c,k){
                        return k.key.length!=1 || /[-0-9. ]/.test(k.key)|| (k.ctrlKey && !!keymap[k.key]);
                    },
                    $compareValue : function(p,a,b){
                        return ((a===''&&b!=='')||(b===''&&a!==''))?false:p.box._number(p, a)==p.box._number(p, b)
                    },
                    $getShowValue : function(p,v){
                        var pp=p.properties;
                        v=(xui.isSet(v)&&v!=="")?xui.formatNumeric(p.box._number(p, v), pp.precision, pp.groupingSeparator, pp.decimalSeparator, pp.forceFillZero):"";
                        if(p.properties.numberTpl)
                            v=p.properties.numberTpl.replace("*", v);
                        return v;
                    },
                    $toEditor : function(p,v){
                        var pp=p.properties;
                        return (xui.isSet(v)&&v!=="")?xui.formatNumeric(p.box._number(p, v), pp.precision, pp.groupingSeparator, pp.decimalSeparator, pp.forceFillZero):"";
                    },
                    $fromEditor : function(p,v){
                        return (xui.isSet(v)&&v!=="")?p.box._number(p, v):"";
                    }
                },'all');
            }

            if(pro.value)
                pro.$UIvalue=pro.value=c._ensureValue(profile,pro.value);

            profile.$typeOK=true;
        },
        $drop:{},
        Appearances:{
            POOL:{
                position:'absolute',
                left:0,
                top:0,
                width:0,
                height:0,
                display:'none',
                visibility:'hidden'
            },
            FILE:{
                visibility:'hidden',
                'z-index':'3',
                border:0,
                width:'100%',
                height:'100%',
                position:'absolute',
                padding:0,
                top:0,
                right:0,
                cursor:'pointer',
                overflow:'hidden'
            },
            'KEY-type-number INPUT, KEY-type-spin INPUT, KEY-type-currency INPUT':{
                $order:4,
                'text-align':'right'
            },
            'KEY-type-file INPUT, KEY-type-button INPUT, KEY-type-dropbutton INPUT, KEY-type-cmdbox INPUT, KEY-type-listbox INPUT':{
                $order:4,
                cursor:'pointer',
                'text-align':'left',
                overflow:'hidden'
            },
            'KEY-type-button INPUT, KEY-type-dropbutton INPUT':{
                $order:5,
                'text-align':'center'
            },
            'RBTN,SBTN,BTN':{
                display:'block',
                'z-index':'1',
                cursor:'pointer',
                padding:0,
                position:'absolute',
                width:'1.5em',

                // for IE8
                overflow:'visible'
            },
            SBTN:{
                $order:2,
                'z-index':'6',
                padding:0
            },
            'R1,R2':{
                $order:1,
                display:'block',
                cursor:'pointer',
                padding:0,
                position:'absolute',
                height:'50%',
                width:'1.5em',

                // for IE8
                overflow:'visible'
            },
            R1:{
                top:0
            },
            R2:{
                bottom:0
            },
            'R1B,R2B':{
                cursor:'pointer',
                position:'absolute',
                left:0,
                top:'50%',
                height:'6px',
                'margin-top':'-2px',
                padding:0,
                'z-index':2
            },
            'SMID,MID':{
                $order:2,
                cursor:'pointer',
                position:'absolute',
                bottom:'2px',
                padding:0,
                left:0
            }
        },

        _objectProp:{popCtrlProp:1,popCtrlEvents:1},
        Behaviors:{
            HoverEffected:{BOX:'BOX'},
            ClickEffected:{BOX:'BOX'},
            FILE:{
                onClick : function(profile, e, src){
                    var prop=profile.properties;
                    if(prop.disabled || prop.readonly)return;
                    if(profile.onFileDlgOpen)profile.boxing().onFileDlgOpen(profile,src);
                },
                onChange:function(profile, e, src){
                    profile.boxing().setUIValue(xui.use(src).get(0).value+'',null,null,'onchange');
                }
            },
            BTN:{
                onClick : function(profile, e, src){
                    var prop=profile.properties, type=prop.type;
                    if(type=='label' || type=='popbox' || type=='cmdbox' || type=='getter' || type=='button' || type=='dropbutton'){
                        if(profile.onClick && false===profile.boxing().onClick(profile, e, src, 'right', prop.$UIvalue))
                            return;
                    }
                    if(type=='file'){
                        profile.boxing().popFileSelector();
                        return;
                    }

                    if(prop.disabled || prop.readonly)return;
                    profile.boxing()._drop(e, src);
                    return false;
                }
            },
            SBTN:{
                onClick : function(profile, e, src){
                    var prop=profile.properties;
                    if(prop.disabled || prop.readonly)return;
                    if(profile.onCommand)profile.boxing().onCommand(profile,src);
                }
            },
            BOX:{
                onClick : function(profile, e, src){
                    var prop=profile.properties;
                    if(prop.type=='cmdbox'||prop.type=='button'||prop.type=='dropbutton'){
                        if(profile.onClick)
                            profile.boxing().onClick(profile, e, src, 'left', prop.$UIvalue);
                    //DOM node's readOnly
                    }else if(prop.inputReadonly || profile.$inputReadonly){
                        if(prop.disabled || prop.readonly)return;
                        profile.boxing()._drop(e, src);
                    }
                }
            },
            INPUT:{
                onClick:function(p,e){
                    // for grid cell editor 'enter' bug: trigger list pop again
                    if(p.$cell){
                        e=xui.Event.getPos(e);
                        if(e.left===0&&e.top===0)return false;
                    }
                },
                onChange:function(profile, e, src){
                    if(profile.$_onedit||profile.$_inner||profile.destroyed||!profile.box)return;
                    var o=profile._inValid,
                        p=profile.properties,b=profile.box,
                        instance=profile.boxing(),
                        v = instance._fromEditor(xui.use(src).get(0).value),
                        uiv=p.$UIvalue;
                    if(!instance._compareValue(uiv,v)){
                        //give a invalid value in edit mode
                        if(v===null)
                            instance._setCtrlValue(uiv);
                        else{
                            // trigger events
                            instance.setUIValue(v,null,null,'onchange');
                            // input/textarea is special, ctrl value will be set before the $UIvalue
                            if(p.$UIvalue!==v)instance._setCtrlValue(p.$UIvalue);
                            if(o!==profile._inValid) if(profile.renderId)instance._setDirtyMark();
                        }
                    }
                    b._asyCheck(profile);
                },
                onKeyup:function(profile, e, src){
                    var p=profile.properties,b=profile.box,
                        key=xui.Event.getKey(e);
                    if(p.disabled || p.readonly)return false;
                    if(profile.$inputReadonly || p.inputReadonly)return;

                    // must be key up event
                    if(key.key=='esc'){
                        if(profile.$escclosedrop){
                            return;
                        }
                        
                        profile.boxing()._setCtrlValue(p.$UIvalue);
                        if(profile.onCancel)
                            profile.boxing().onCancel(profile);
                    }

                    if(p.dynCheck){
                        var value=xui.use(src).get(0).value;
                        profile.box._checkValid(profile, value);
                        profile.boxing()._setDirtyMark();
                    }
                    b._asyCheck(profile);

                    if(key.key=='down'|| key.key=='up'){
                        if(p.type=='spin'){
                            xui.Thread.abort(profile.$xid+':spin');
                            return false;
                        }
                    }
                },
                onMousedown:function(profile, e, src){
                    profile._mousedownmark=1;
                    xui.asyRun(function(){if(profile)delete profile._mousedownmark;});
                },
                onMouseup:function(profile, e, src){
                    if(profile.properties.selectOnFocus && profile._stopmouseupcaret){
                        var node=xui.use(src).get(0);
                        if(!node.readOnly && node.select){
                            profile.$mouseupDelayFun=xui.asyRun(function(){
                                delete profile.$mouseupDelayFun;
                                if(node.tagName.toLowerCase()=="input" || !/[\n\r]/.test(node.value))node.select();
                            })
                        }
                        delete profile._stopmouseupcaret;
                    }
                },
                onFocus:function(profile, e, src){
                    var p=profile.properties,b=profile.box;
                    if(p.disabled || p.readonly)return false;
                    if(profile.onFocus)profile.boxing().onFocus(profile);
                    if(profile.$inputReadonly || p.inputReadonly)return;
                    profile.getSubNode('BORDER').tagClass('-focus');
                    
                    var instance=profile.boxing(),
                        uiv=p.$UIvalue,
                        v=instance._toEditor(uiv),
                        node=xui.use(src).get(0),
                        nodev=node.value;

                    // if _toEditor adjust value, ensure node value
                    if(uiv!==v && nodev!==v){
                        profile.$_onedit=true;
                        node.value=v;
                        delete profile.$_onedit;
                    }

                    //if no value, add mask
                    if(p.mask){
                        var value=node.value;
                        if(!value){
                            profile.$focusDelayFun=xui.asyRun(function(){
                                // destroyed
                                if(!profile.box)return;
                                delete profile.$focusDelayFun;
                                profile.$_onedit=true;
                                profile.boxing()._setCtrlValue(value=profile.$Mask);
                                delete profile.$_onedit;
                                b._setCaret(profile,node);
                            });
                        }
                    }
                    if(p.selectOnFocus && !node.readOnly && node.select){
                        if(xui.browser.kde){
                            profile.$focusDelayFun2=xui.asyRun(function(){
                                delete profile.$focusDelayFun2;
                                if(node.tagName.toLowerCase()=="input" || !/[\n\r]/.test(node.value))node.select();
                            });
                        }else{
                            if(node.tagName.toLowerCase()=="input" || !/[\n\r]/.test(node.value))node.select();
                        }
                        // if focus was triggerred by mousedown, try to stop mouseup's caret
                        if(profile._mousedownmark)profile._stopmouseupcaret=1;
                    }
                    //show tips color
                    profile.boxing()._setTB(3);   
                    
                    b._asyCheck(profile);             
                },
                onBlur:function(profile, e, src){
                    xui.resetRun(profile.$xid+":asycheck");
                    if(profile.$focusDelayFun)xui.clearTimeout(profile.$focusDelayFun);
                    if(profile.$focusDelayFun2)xui.clearTimeout(profile.$focusDelayFun2);
                    if(profile.$focusDelayFun2)xui.clearTimeout(profile.$mouseupDelayFun);
                    
                    var p=profile.properties;
                    if(p.disabled || p.readonly)return false;
                    if(profile.onBlur)profile.boxing().onBlur(profile);
                    if(profile.$inputReadonly || p.inputReadonly)return;

                    var b=profile.box,
                        instance=profile.boxing(),
                        uiv=p.$UIvalue,
                        v = xui.use(src).get(0).value;
                        
                    if(profile.$Mask && profile.$Mask==v){
                        v="";
                        uiv=profile.$Mask;
                    }
                    v=instance._fromEditor(v);

                    profile.getSubNode('BORDER').tagClass('-focus',false);

                    //onblur check it
                    if(instance._compareValue(p.$UIvalue,v)){
                        profile.box._checkValid(profile, v);
                        instance._setCtrlValue(uiv);
                    }
                    instance._setDirtyMark();
                    b._asyCheck(profile,false);
                },
                onKeydown : function(profile, e, src){
                   var  p=profile.properties;
                   if(p.disabled || p.readonly)return;
                   var b=profile.box,
                        m=p.multiLines,
                        evt=xui.Event,
                        k=evt.getKey(e);

                    //fire onchange first
                    if(k.key=='enter' && (!m||k.altKey) && !p.inputReadonly && !profile.$inputReadonly){
                        profile.$_onedit=true;
                        profile.boxing().setUIValue(profile.boxing()._fromEditor(xui.use(src).get(0).value),true,null,'enter');
                        profile.$_onedit=false;
                    }

                    b._asyCheck(profile);

                    if(p.mask){
                        if(k.key.length>1)profile.$ignore=true;
                        else delete profile.$ignore;
                        switch(k.key){
                            case 'backspace':
                                b._changeMask(profile,xui.use(src).get(0),'',false);
                                return false;
                            case 'delete':
                                b._changeMask(profile,xui.use(src).get(0),'');
                                return false;
                        }
                    }

                    if(k.key=='down'|| k.key=='up'){
                        if(p.type=='spin'){
                            if(!k.ctrlKey){
                                profile.box._spin(profile, k.key=='up');
                                return false;
                            }
                        }else if(k.ctrlKey && p.type!='none' && p.type!='input' && p.type!='password'){
                            profile.boxing()._drop(e,src);
                            return false;
                        }
                    }
                },
                onDblclick:function(profile, e, src){
                    profile.getSubNode('BTN').onClick(true);
                }
            },
            R1:{
                onMousedown:function(profile){
                    var prop=profile.properties;
                    if(prop.disabled || prop.readonly)return;
                    profile.box._spin(profile, true);
                },
                onMouseout:function(profile){
                    xui.Thread.abort(profile.$xid+':spin');
                },
                onMouseup:function(profile){
                    xui.Thread.abort(profile.$xid+':spin');
                }
            },
            R2:{
                onMousedown:function(profile){
                    var prop=profile.properties;
                    if(prop.disabled || prop.readonly)return;
                    profile.box._spin(profile, false);
                },
                onMouseout:function(profile){
                    xui.Thread.abort(profile.$xid+':spin');
                },
                onMouseup:function(profile){
                    xui.Thread.abort(profile.$xid+':spin');
                }
            }
        },
        EventHandlers:{
            onFileDlgOpen:function(profile, src){},
            onCommand:function(profile, src){},
            beforeComboPop:function(profile, pos, e, src){},
            beforePopShow:function(profile, popCtl){},
            afterPopShow:function(profile, popCtl){},
            afterPopHide:function(profile, popCtl, type){},
            onClick:function(profile, e, src, btn, value){}
        },
        DataModel:{
            cachePopWnd:true,
            // allowed: yyyy,mm,dd,y,m,d
            // yyyy-mm-dd
            // yyyy/mm/dd
            dateEditorTpl:"",
            
            // for number&currency
            precision:2,
            groupingSeparator:",",
            decimalSeparator:".",
            forceFillZero:true,

            popCtrlProp:{
                ini:{}
            },
            popCtrlEvents:{
                ini:{}
            },
            numberTpl:{
                ini:"",
                action: function(){
                    this.boxing().setUIValue(this.properties.$UIvalue,true,null,'tpl');
                }
            },
            currencyTpl:{
                ini:"$ *",
                action: function(){
                    this.boxing().setUIValue(this.properties.$UIvalue,true,null,'tpl');
                }
            },
            listKey:{
                set:function(value){
                    var t = xui.UI.getCachedData(value),
                        o=this;
                    o.boxing().setItems(t?xui.clone(t):o.properties.items);
                    o.properties.listKey = value;
                }
            },
            dropListWidth:0,
            dropListHeight:0,
            items:{
                ini:[],
                set:function(value){
                    var o=this;
                    value = o.properties.items = o.box._adjustItems(value);
                    if(o.renderId){
                        //clear those
                        o.SubSerialIdMapItem={};
                        o.ItemIdMapSubSerialId={};
                        o.box._prepareItems(o, value);

                        // if popped
                        if(o.$poplink)
                            o.$poplink.boxing().setItems(value);
                        else
                            o.boxing().clearPopCache();
                    }
                }
            },
            btnImage:{
                action: function(value){
                    this.getSubNode('MID')
                        .css('backgroundImage',value?('url('+value+')'):'');
                }
            },
            btnImagePos:{
                action: function(value){
                    this.getSubNode('MID')
                        .css('backgroundPosition', value);
                }
            },
            type:{
                ini:'combobox',
                listbox:xui.toArr('none,input,password,combobox,listbox,file,getter,helpinput,button,dropbutton,cmdbox,popbox,date,time,datetime,color,spin,currency,number'),
                set:function(value){
                    var pro=this;
                    pro.properties.type=value;
                    if(pro.renderId)
                        pro.boxing().refresh(true);
                }
            },
            increment:0.01,
            min:-Math.pow(10,15),
            // big number for date
            max:Math.pow(10,15),
            commandBtn:{
                ini:"none",
                combobox:xui.toArr("none,save,delete,add,remove,pop,select,search"),
                action:function(v,ov){
                    this.boxing().refresh();
                }
            },
            disabled:{
                ini:false,
                action: function(v){
                    var i=this.getSubNode('INPUT'),
                         cls="xui-ui-disabled",
                        type=(""+i.get(0).type);
                    if(v)this.getRoot().addClass(cls);
                    else this.getRoot().removeClass(cls);

                    if(type!='button'&&type!='dropbutton'){
                        if(!v && (this.properties.readonly||this.$inputReadonly))
                            v=true;
                        // use 'readonly'(not 'disabled') for selection
                        i.attr('readonly',v);
                    }
                }
            },
            inputReadonly:{
                ini:false,
                action: function(v){
                    var i=this.getSubNode('INPUT'),
                         cls="xui-ui-readonly";
                    if(!v && (this.properties.disabled||this.properties.readonly||this.$inputReadonly))
                        v=true;

                    if(v)this.getRoot().addClass(cls);
                    else this.getRoot().removeClass(cls);

                    i.attr('readonly',v).css('cursor',v?'pointer':'');
                }
            },
            readonly:{
                ini:false,
                action: function(v){
                    var i=this.getSubNode('INPUT'),
                        cls="xui-ui-readonly";
                    if(!v && (this.properties.disabled||this.properties.inputReadonly||this.$inputReadonly))
                        v=true;

                    if(v)this.getRoot().addClass(cls);
                    else this.getRoot().removeClass(cls);

                    i.attr('readonly',v).css('cursor',v?'pointer':'');   
                }
            },
            // caption is for readonly comboinput(listbox/cmdbox are readonly)
            caption:{
                ini:null,
                set:function(v){
                    var p=this.properties;
                    p.caption=v;
                    
                    if(xui.isSet(v)){
                        v=v+"";
                        p.caption=xui.adjustRes(v,false);
                    }
                    if(this.renderId){
                        if(this.$inputReadonly || p.inputReadonly){
                            this.getSubNode('INPUT').attr("value",this.boxing().getShowValue());
                        }
                    }
                },
                get:function(){
                    return this.boxing().getShowValue();
                }
            }
        },
        RenderTrigger:function(){
            var self=this,
                instance=self.boxing(),
                p=self.properties;
            self.box._iniType(self);

            if(p.readonly)
                instance.setReadonly(true,true);
            else if(p.inputReadonly)
                instance.setInputReadonly(true,true);
        },
        _spin:function(profile, flag){
            var id=profile.$xid+':spin';
            if(xui.Thread.isAlive(id))return;
            var prop=profile.properties,
                off=prop.increment*(flag?1:-1),
                task={delay:300},
                fun=function(){
                    if(profile.destroyed)return false;
                    var v=((+prop.$UIvalue)||0)+off;
                    v=(xui.isSet(v)&&v!=="")?xui.formatNumeric(profile.box._number(profile, v), prop.precision, prop.groupingSeparator, prop.decimalSeparator, prop.forceFillZero):"";
                    profile.boxing().setUIValue(v,null,null,'spin');
                    task.delay *=0.9;
                };
            task.task=fun;
            xui.Thread(id,[task],500,null,fun,null,true).start();
        },
        _dynamicTemplate:function(profile){
            var properties = profile.properties,
                hash = profile._exhash = "$" +
                    'multiLines:'+properties.multiLines+';'+
                    'type:'+properties.type+';',
                template = profile.box.getTemplate(hash);

            properties.$UIvalue = properties.value;

            // set template dynamic
            if(!template){
                template = xui.clone(profile.box.getTemplate());
                var t=template.FRAME.BORDER;

                t.BOX.WRAP.INPUT.tagName='input';
                t.BOX.WRAP.INPUT.type='text';
                switch(properties.type){
                case "none":
                case "input":
                case "number":
                case "currency":
                break;
                case 'button':
                    t.BOX.WRAP.INPUT.type='button';
                break;
                case 'password':
                    t.BOX.WRAP.INPUT.type='password';
                break;
                // spin has spin buttons
                case 'spin':
                    t.RBTN={
                        $order:20,
                        className:'xui-ui-unselectable',
                        style:"{rDisplay}",
                        R1:{
                            tagName:'button',
                            className:'xui-ui-btn xui-nofocus {_radius_drop1}',
                            R1B:{
                                className:'xuifont',
                                $fonticon:'xui-icon-smallup'
                            }
                        },
                        R2:{
                            tagName:'button',
                            className:'xui-ui-btn xui-nofocus {_radius_drop2}',
                            R2B:{
                                className:'xuifont',
                                $fonticon:'xui-icon-smalldown'
                            }
                        }
                    };
                break;

                // following have BTN button
                case 'file':
                    t.FILE={
                        $order:20,
                        className:'xui-ui-unselectable {_radius_drop}',
                        tagName:'input',
                        type:'file',
                        hidefocus:xui.browser.ie?"hidefocus":null,
                        size:'1'
                    };
                case 'listbox':
                case 'cmdbox':
                case 'dropbutton':
                    t.BOX.WRAP.INPUT.type='button';
                default:
                    t.BTN={
                        $order:20,
                        tagName:'button',
                        className:'xui-ui-unselectable xui-ui-btn xui-nofocus {_radius_drop}',
                        style:"{_popDisplay}",
                        MID:{
                            className:'xuifont',
                            $fonticon:'{_fi_btnClass}',
                            style:'{_btnStyle}'
                        }
                    };
                }
                if(properties.type=='button'||properties.type=='dropbutton'){
                    t.BOX.className += ' xui-ui-gradientbg';
                }

                if(properties.multiLines){
                    switch(properties.type){
                    case 'none':
                    case 'input':
                    case 'getter':
                    case 'helpinput':
                    case 'popbox':
                    case 'number':
                    case 'combobox':
                        t.BOX.WRAP.INPUT.tagName='textarea';
                        delete t.BOX.WRAP.INPUT.type;
                    }
                }

                // set template
                profile.box.setTemplate(template, hash);
            }
            profile.template = template;
        },
        _prepareData:function(profile){
            var data={},
                NONE='display:none',
                prop=profile.properties,
                type=prop.type,
                arr=profile.box.$DataModel.commandBtn.combobox;
            data=arguments.callee.upper.call(this, profile, data);

            var tt=type,a,b;
            tt=(tt=='combobox'||tt=='listbox'||tt=='dropbutton')?'arrowdrop':tt;

            data._fi_btnClass = "xui-uicmd-" + tt;
            if(data.btnImage)
                data._btnStyle = 'background: url('+data.btnImage+')' + (data.btnImagePos||'');
            data._type="text";

            data._cmdDisplay = (a=(!data.commandBtn)||data.commandBtn=='none')?NONE:'';
            data._fi_commandCls = (xui.arr.indexOf(arr, data.commandBtn)!=-1?"xui-uicmd-":"") + data.commandBtn;

            data._popDisplay = (b=type=='none'||type=='input'||type=='password'||type=='currency'||type=='number'||type=='button')?NONE:'';
            data.typecls=profile.getClass('KEY','-type-'+data.type);

            data._radius_input=(a&&b)?'xui-uiborder-radius':'xui-uiborder-radius-tl xui-uiborder-radius-bl';
            data._radius_drop=a?'xui-uiborder-radius-tr xui-uiborder-radius-br':'xui-uiborder-noradius';
            data._radius_drop1=a?'xui-uiborder-radius-tr':'xui-uiborder-noradius';
            data._radius_drop2=a?'xui-uiborder-radius-br':'xui-uiborder-noradius';

            return data;
        },
        _ensureValue:function(profile, value){
            var me=arguments.callee, prop=profile.properties;
            //if value is empty
            if(!xui.isSet(value) || value==='')return '';
            if(profile.$Mask && profile.$Mask==value){
                value='';
            }
            switch(profile.properties.type){
                case 'date':
                case 'datetime':
                    var d;
                    if(value){
                        if(xui.isDate(value))
                            d=value;
                        else if(xui.isFinite(value))
                            d=new Date(parseInt(value,10));
                        else
                            d=xui.Date.parse(value+"");
                    }
                    return d?String(profile.properties.type=='datetime'?d.getTime():xui.Date.getTimSpanStart(d,'d',1).getTime()):"";
                case 'color':
                    var c=xui.UI.ColorPicker._ensureValue(null,value);
                    return (c=="transparent"?'':'#')+c;
                case 'time':
                    return xui.UI.TimePicker._ensureValue(null,value);
                case 'currency':
                case 'number':
                case 'spin':
                    return this._number(profile, value);                
                default:
                    return typeof value=='string'?value:(value||value===0)?String(value):'';
            }
        },        
        _number:function(profile, value){
            var prop=profile.properties;
            value=xui.toNumeric(value, prop.precision, prop.groupingSeparator, prop.decimalSeparator, prop.forceFillZero);
            if(xui.isSet(prop.max))
                value=value>prop.max?prop.max:value;
            if(xui.isSet(prop.min))
                value=value<prop.min?prop.min:value;
            return value;
        },
        _onresize:function(profile,width,height){
             var prop = profile.properties,
                 type = prop.type,
                // if any node use other font-size which does not equal to xui-node, use 'px' 
                f=function(k){if(!k) return null; k=profile.getSubNode(k); return k;},
                root=f('KEY'),
                v1=f('INPUT'),
                box = f('BOX'), 
                label = f('LABEL'),
                commandbtn=f(prop.commandBtn!='none'?'SBTN':null),
                functionbtn=f(type=='spin'?'RBTN':(type=='none'||type=='input'||type=='password'||type=='currency'||type=='number'||type=='button')?null:'BTN'),
                // determine em
                useem = xui.$uem(prop),
                needfz = useem||profile.$isEm(width)||profile.$isEm(height),
                boxfz=useem?box._getEmSize():null,
                v1fz=useem?v1._getEmSize():null,
                labelfz=needfz||profile.$isEm(labelSize)?label._getEmSize():null,
                adjustunit = function(v,emRate){return profile.$forceu(v, useem?'em':'px', emRate)},

                isB=v1.get(0).type.toLowerCase()=='button',
                $hborder, $vborder,
                clsname='xui-node xui-input-input',
                paddingH=isB?0:v1._paddingH(),
                paddingW=isB?0:v1._paddingW(),
                btnw, autoH;

             $hborder=$vborder=box._borderW() / 2;
            btnw=root._getEmSize() * 1.5;

            // caculate by px
            if(height)height = (autoH=height=='auto') ? profile.$em2px(1.83,null,true) : profile.$isEm(height) ? profile.$em2px(height,null,true) : height;
            if(width)width = profile.$isEm(width) ? profile.$em2px(width,null,true) : width;

            // for auto height
            if(autoH)root.height(adjustunit(height));

            var 
                // make it round to Integer
                labelSize=profile.$px(prop.labelSize,labelfz,true)||0,
                labelGap=profile.$px(prop.labelGap,null,true)||0,
                labelPos=prop.labelPos || 'left',
                ww=width,
                hh=height,
                bw1=0,
                bw2=0,
                left=Math.max(0, (prop.$b_lw||0)-$hborder),
                top=Math.max(0, (prop.$b_tw||0)-$vborder);
            if(null!==ww){
                ww -= Math.max($hborder*2, (prop.$b_lw||0)+(prop.$b_rw||0));
                bw1=(commandbtn?btnw:0);
                bw2=(functionbtn?btnw:0);
//                bw1=(commandbtn?commandbtn.offsetWidth:0);
//                bw2=(functionbtn?functionbtn.offsetWidth:0);
                ww -= (bw1+bw2);
                /*for ie6 bug*/
                /*for example, if single number, 100% width will add 1*/
                /*for example, if single number, attached shadow will overlap*/
                if(xui.browser.ie6)ww=(Math.round(ww/2))*2;
            }
            if(null!==hh){
                hh -=Math.max($vborder*2, (prop.$b_lw||0) + (prop.$b_rw||0));

                if(xui.browser.ie6)hh=(Math.round(hh/2))*2;
                /*for ie6 bug*/
                if(xui.browser.ie6&&null===width)box.ieRemedy();
            }
            var iL=left + (labelPos=='left'?labelSize:0),
                iT=top + (labelPos=='top'?labelSize:0),
                iW=ww===null?null:Math.max(0,ww - ((labelPos=='left'||labelPos=='right')?labelSize:0)),
                iH=hh===null?null:Math.max(0,hh - ((labelPos=='top'||labelPos=='bottom')?labelSize:0)),
                iH2=hh===null?null:Math.max(0,height - ((labelPos=='top'||labelPos=='bottom')?labelSize:0));
            // for left offset 1px
            iW += (functionbtn?$hborder:0) + (commandbtn?$hborder:0);

             if(null!==iW && iW-paddingW>0)
                v1.width(adjustunit(Math.max(0,iW-paddingW),v1fz));
            if(null!==iH && iH-paddingH>0)
                v1.height(adjustunit(Math.max(0,iH-paddingH),v1fz));

            box.cssRegion({
                left:adjustunit(iL,boxfz),
                top:adjustunit(iT,boxfz),
                width:adjustunit(iW,boxfz),
                height:adjustunit(iH,boxfz)
            });
            
            if(labelSize)
                label.cssRegion({
                    left:adjustunit(ww===null?null:labelPos=='right'?(ww-labelSize+labelGap+bw1+bw2+$hborder*2):0,labelfz),
                    top: adjustunit(height===null?null:labelPos=='bottom'?(height-labelSize+labelGap):0,labelfz), 
                    width:adjustunit(ww===null?null:Math.max(0,((labelPos=='left'||labelPos=='right')?(labelSize-labelGap):ww)),labelfz),
                    height:adjustunit(height===null?null:Math.max(0,((labelPos=='top'||labelPos=='bottom')?(labelSize-labelGap):height)),labelfz)
                });

            // left offset 1px
            iL += (iW||0) + $hborder*2 -$hborder;
            if(functionbtn){
                if(iH2!==null)
                    functionbtn.height(adjustunit(Math.max(0,iH2)));
                if(iW!==null)
                    functionbtn.left(adjustunit(iL));
                functionbtn.top(adjustunit(iT));

               if(iH2!==null && prop.type=='spin'){
                    if(iH2/2-$vborder*2>0){
                        f('R1').height(adjustunit(iH2/2));
                        // left offset 1px
                        f('R2').height(adjustunit(iH2/2 + $hborder));
                    }
                }
                // left offset 1px
                iL += bw1-$hborder;
            }
            if(commandbtn){
                if(iH2!==null)
                    commandbtn.height(adjustunit(Math.max(0,iH2)));
                if(iW!==null)
                    commandbtn.left(adjustunit(iL));
                commandbtn.top(adjustunit(iT));
            }

            /*for ie6 bug*/
            if((profile.$resizer) && xui.browser.ie){
                box.ieRemedy();
            }
        }
    }
});