Class("xui.UI.ButtonViews", "xui.UI.Tabs",{
    Initialize:function(){        
        var t=this.getTemplate(),keys=this.$Keys;
        t.LIST.className='xui-uibar';
        this.setTemplate(t);
        t.$submap.items.ITEM.className = 'xui-ui-btn xui-uiborder-radius {itemClass} {disabled} {readonly} {itemPosCls}';
        delete keys.LEFT;delete keys.RIGHT;delete keys.DROP;
    },
    Static:{
        Appearances:{
            LIST:{
                'z-index':'2',
                position:'absolute',
                'white-space': 'nowrap',
                overflow:'hidden'
            },
            // for auto height
            'LIST-top, LIST-bottom':{
                $order:2,
                position:'relative'
            },
            LISTBG:{
                display:'none'
            },
            MENU:{
                display:'none',
                margin:'.25em',
                padding:'.25em',
                cursor:'pointer'
            },
            MENU2:{
                display:'none',
                'text-align':'center'
           },
            MENUICON2:{
                position:'relative',
                margin:'.09375em',
                padding:'.1875em',
                cursor: 'pointer'
            },
            ITEMS:{
                'z-index':'2',
                position:'relative',
                left:0,
                top:0,
                width:'100%',
                height:'100%',
                'white-space': 'nowrap',
                overflow:'hidden',
                'overflow-y':'scroll'
            },
            'ITEMS-left, ITEMS-left ITEMC':{
                $order:1,
                height:'auto',
                'text-align': 'left'
            },
            'ITEMS-center, ITEMS-center ITEMC':{
                $order:1,
                height:'auto',
                'text-align': 'center'
            },
            'ITEMS-right, ITEMS-right ITEMC':{
                $order:1,
                height:'auto',
                'text-align': 'right'
            },
            'ITEMS-left HANDLE, ITEMS-right HANDLE':{
                $order:2,
                display:'block'
            },
            ITEM:{
                $order:0,
                margin:'.166667em',
                position:'relative',
                cursor:'pointer',
                'padding':'0 .125em 0 0',
                'vertical-align':'top'
            },
            ITEMI:{
                $order:0,
                'padding-left':'.125em',
                //keep this same with ITEM
                'vertical-align':'top'
            },
            'ITEMS-block ITEM, ITEMS-block ITEMI, ITEMS-block ITEMC':{
                $order:2,
                display:'block'
            },
            ITEMC:{
                $order:0,
                padding:'.15em 0 .125em 0',
                //keep this same with ITEM
                'vertical-align':'top',
                'text-align': 'center'
            },             
            HANDLE:{
                display:xui.$inlineBlock,
                zoom:xui.browser.ie6?1:null,
                cursor:'pointer',
                'vertical-align':'middle',
                margin:'.125em'
            },
            'ITEM-checked HANDLE':{
            }
        },
        DataModel:{
            HAlign:null,
            barLocation:{
                ini:'top',
                listbox:['top','bottom','left','right'],
                action:function(v){
                    var self=this,
                        hs = self.getSubNode('LIST'),
                        h = self.getSubNode('ITEMS'),
                        unit = 0+self.$picku();
                    switch(v){
                        case 'left':
                            hs.cssRegion({left:unit,top:unit,right:'auto',bottom:unit});
                        break;
                        case 'top':
                            hs.cssRegion({left:unit,top:unit,right:unit,bottom:'auto'});
                        break;
                        case 'right':
                            hs.cssRegion({left:'auto',top:unit,right:unit,bottom:unit});
                        break;
                        case 'bottom':
                            hs.cssRegion({left:unit,top:'auto',right:unit,bottom:unit});
                       break;
                    }
                    switch(v){
                        case 'left':
                        case 'right':
                            h.tagClass('-block',true);
                            break;
                        case 'top':
                        case 'bottom':
                            h.tagClass('-block',false);
                            hs.height('auto');
                            break;
                    }
                    self.boxing().setBarSize(self.properties.barSize,true);

                    hs.tagClass('(-top|-bottom|-left|-right)',false).tagClass('-'+v, true);
                }
            },
            barHAlign:{
                ini:'left',
                listbox:['left','center', 'right'],
                action:function(v){
                    var hl=this.getSubNode('ITEMS');
                    hl.tagClass('(-left|-right|-center)',false).tagClass('-'+v, true);
                }
            },
            barVAlign:{
                ini:'top',
                listbox:['top','bottom'],
                action:function(v){
                    var hl = this.getSubNode('ITEMS'),
                        unit = 0+this.$picku();
                    if(v=='top')
                        hl.cssRegion({top:unit,bottom:'auto'});
                    else
                        hl.cssRegion({bottom:unit,top:'auto'});
                }
            },
            barSize:{
                ini:50,
                action:function(v){
                    var self = this,
                        t = self.properties,
                        useem = xui.$uem(t),
                        adjustunit = function(v,emRate){return self.$forceu(v, useem?'em':'px', emRate)},
                        noPanel = t.noPanel,
                        hs = self.getSubNode('LIST'),
                        hl = self.getSubNode('ITEMS'),
                        menu2 =  self.getSubNode('MENUICON2');

                    if(t.sideBarStatus=='fold'){
                        hl.tagClass('-icon2',true);
                        menu2.tagClass('-checked',true);
                    }else{
                        hl.tagClass('-icon2',false);
                        menu2.tagClass('-checked',false);
                    }

                    t=self.getRootNode().style;
                    xui.UI.$tryResize(self,t.width, t.height,true);
                }
            },
            noPanel:{
                ini:false,
                action:function(v){
                    this.boxing().setBarSize(this.properties.barSize,true);
                }
            },
            borderType:{
                ini:'none',
                listbox:['none','flat','inset','outset'],
                action:function(v){
                    var ns=this,
                        p=ns.properties,
                        n1=ns.getSubNode('LIST'),
                        reg=/^xui-uiborder-/,
                        flat='xui-uiborder-flat xui-uiborder-radius',
                        ins='xui-uiborder-inset xui-uiborder-radius',
                        outs='xui-uiborder-outset xui-uiborder-radius',
                        root=ns.getRoot();
                    n1.removeClass(reg);
                    switch(v){
                        case 'flat':
                        n1.addClass(flat);
                        break;
                        case 'inset':
                        n1.addClass(ins);
                        break;
                        case 'outset':
                        n1.addClass(outs);
                        break;
                    }

                    //force to resize
                    xui.UI.$tryResize(ns,root.get(0).style.width,root.get(0).style.height,true);
                }
            },
            sideBarStatus:{
                ini:'expand',
                listbox:['expand','fold'],
                action:function(v){
                   this.boxing().setBarSize(this.properties.barSize,true);
                }
            },
            sideBarSize:{
                ini:'3em',
                action:function(v){
                   // trigger layout
                   this.boxing().setBarSize(this.properties.barSize,true);
                }
            }
        },
        Behaviors:{
            MENU2:{
                onClick:function(profile, e, src){
                    profile.boxing().setSideBarStatus(profile.properties.sideBarStatus=='fold'?'expand':'fold', true);
                }
            }
        },
        LayoutTrigger:function(){
            var pro = this.properties;
            this.boxing().setBarLocation(pro.barLocation,true)
            .setBarHAlign(pro.barHAlign,true)
            .setBarVAlign(pro.barVAlign,true);

            if(pro.barLocation=='top'||pro.barLocation=='bottom'){
                this.getSubNode('ITEMS').addClass('xui-css-noscroll');
            }
            if(pro.borderType&&pro.borderType!='none')this.boxing().setBorderType(pro.borderType,true);
        },
        _onresize:function(profile,width,height,force,key){
            var prop = profile.properties,
                noPanel = prop.noPanel,
                item = profile.getItemByItemId(key);

            if(!item){
                key=prop.$UIvalue;
                item = profile.getItemByItemId(key);
            }

            var panel = profile.boxing().getPanel(key),
                useem = xui.$uem(prop),
                adjustunit = function(v,emRate){return profile.$forceu(v, useem?'em':'px', emRate)},
                panelfz = useem?panel._getEmSize():null,
                // caculate by px
                ww=width?profile.$px(width, null, true):width, 
                hh=(height&&height!='auto')?profile.$px(height, null, true):height,

                hs = profile.getSubNode('LIST'),
                hl = profile.getSubNode('ITEMS'),
                menu2 =  profile.getSubNode('MENU2'),
                hsfz =  useem?hs._getEmSize():null,
                hlfz =  useem?hl._getEmSize():null,
                type = prop.borderType,
                bw = (type=='flat'||type=='inset'||type=='outset') ? hs._borderW() : 0,
                wc=null,
                hc=null,
                top, left, itmsH;

            if(!prop.noHandler){
                if(prop.barLocation=='top'||prop.barLocation=='bottom'){
                    itmsH = hs.offsetHeight(true);
                    if(width){
                        hs.width(adjustunit(ww-bw, hsfz));
                        hl.width(adjustunit(ww-bw, hlfz));
                        // for nopanel:
                        if(noPanel && height!='auto')
                            hs.height(adjustunit(hh-bw, hsfz));
                        
                        if(!prop.noHandler)
                            profile.box._adjustHScroll(profile);

                        left = 0;
                        wc=ww;
                    }
                    if(hh!='auto'){
                        // caculate by px
                        if(hh-itmsH>0)hc=hh-itmsH-bw;
                        //hs.height(adjustunit(itmsH, hsfz));
                    }else{
                        hc=hh;
                    }
                }else{
                    // dont support auto height for 'top' or 'bottom' barLocation
                    if(hh=='auto'){
                        hh=300;
                    }
                    // side bar
                    menu2.css('display',prop.sideBarSize?'block':'none');

                    if(height){
                        // for nopanel:
                        hs.height(adjustunit(hh-bw, hsfz));
                        hl.height(adjustunit(hh-bw-(prop.sideBarSize?menu2.offsetHeight():0), hlfz));
    
                        hc=hh;
                    }
                    if(height || width){
                        var v = profile.$px(prop.sideBarStatus=='fold' ? prop.sideBarSize : prop.barSize, hlfz);
                        var vv = hl._paddingW() + hl._marginW();

                        //caculate by px
                        left = prop.barLocation=='left'?bw+profile.$px(v+vv, hsfz):0;
                        wc = ww-profile.$px(v+vv, hsfz)-bw;

                        if(!noPanel){
                            hs.width( adjustunit(v + vv , hsfz) );
                            hl.width( adjustunit(v + xui.Dom.getScrollBarSize(), hlfz) );
                        }
                    }
                }
            }else{
                wc=ww;
                hc=hh;
            }

            if(!noPanel)
                if(panel && !panel.isEmpty())panel.cssRegion({
                    width : wc?adjustunit(wc,panelfz):null,
                    height : hc?adjustunit(hc,panelfz):null,
                    left : adjustunit(left,panelfz)
                },true);
        }
    }
});