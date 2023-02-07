/*----------------------------------------------------------------
 
 Class: adobe
 
 Properties:
 console - undefined
 debugging - boolean
 options - hash
 version - string
 COLOR_DEPTH - number or NaN
 DIR - string
 FILE - string
 PATH - string
 SCRIPT_BUILD - number or NaN
 SCRIPT_ENGINE - string
 SCRIPT_VERSION - number or NaN
 
 ----------------------------------------------------------------*/

var adobe = Class.create({
   initialize: function(options) {
      var src = document.getElementById("adobe").getAttribute("src"),
          lastfolder = src.lastIndexOf("/"),
          folders = src.substring(0, lastfolder),
          file = src.substring(lastfolder+1),
          q = src.split("?")[1],
          options = options || {},
          NAN = parseInt("");
      
      if(q) { Object.extend(options, q.toQueryParams()); }
      
      this.version = "0.1";
      this.options = options;
      this.debugging = false;
      this.console;
      this.DIR = folders;
      this.PATH = folders+"/";
      this.FILE = file;
      this.COLOR_DEPTH = screen.colorDepth || NAN;
      this.SCRIPT_ENGINE = (window.ScriptEngine) ? window.ScriptEngine() : "JavaScript";
      this.SCRIPT_VERSION = (this.SCRIPT_ENGINE == "JScript") ? (ScriptEngineMajorVersion()+ScriptEngineMinorVersion()/10) : NAN;
      this.SCRIPT_BUILD = (this.SCRIPT_ENGINE == "JScript") ? ScriptEngineBuildVersion() : NAN;
   },
   /*----------------------------------------------------------------
    
    Method: debug
    Set to true, this provides <Console> methods in the adobe object eg. adobe.log
    
    >	adobe.debug(true)
    
    Parameters:
    bool - boolean
    
    Returned Value:
    Nothing
    
    ----------------------------------------------------------------*/
   debug: function(bool) {
      if(this.debugging === bool) {return;}
      this.debugging = !!bool;
      adobe.Jsan.errorLevel = (this.debugging) ? "die" : "none";
      adobe.Jsan.use("adobe.Console");
      var console = new adobe.Console();
      Object.extend(this, console);
   }
});

adobe = new adobe();

/*----------------------------------------------------------------
 
 JSAN implementation
 
 ----------------------------------------------------------------*/

adobe.Jsan = function () { adobe.Jsan.addRepository(arguments) }

adobe.Jsan.VERSION = 0.10;

adobe.Jsan.globalScope   = self;
adobe.Jsan.includePath   = ['.', 'lib'];
adobe.Jsan.errorLevel    = "none";
adobe.Jsan.errorMessage  = "";
adobe.Jsan.loaded        = {};

adobe.Jsan.use = function () {
   var classdef = adobe.Jsan.require(arguments[0]);
   if (!classdef) return null;
   
   var importList = adobe.Jsan._parseUseArgs.apply(adobe.Jsan, arguments).importList;
   adobe.Jsan.exporter(classdef, importList);
   
   return classdef;
}

adobe.Jsan.require = function (pkg) {
   var path = adobe.Jsan._convertPackageToPath(pkg);
   if (adobe.Jsan.loaded[path]) {
      return adobe.Jsan.loaded[path];
   }
   
   try {
      var classdef = eval(pkg);
      if (typeof classdef != 'undefined') return classdef;
   } catch (e) { /* nice try, eh? */ }
   
   
   for (var i = 0; i < adobe.Jsan.includePath.length; i++) {
      var js;
      try{
         var url = adobe.Jsan._convertPathToUrl(path, adobe.Jsan.includePath[i]);
         js  = adobe.Jsan._loadJSFromUrl(url);
      } catch (e) {
         if (i == adobe.Jsan.includePath.length - 1) throw e;
      }
      if (js != null) {
         var classdef = adobe.Jsan._createScript(js, pkg);
         adobe.Jsan.loaded[path] = classdef;
         return classdef;
      }
   }
   return false;
   
}

adobe.Jsan.exporter = function () {
   adobe.Jsan._exportItems.apply(adobe.Jsan, arguments);
}

adobe.Jsan.addRepository = function () {
   var temp = adobe.Jsan._flatten( arguments );
   // Need to go in reverse to do something as simple as unshift( @foo, @_ );
   for ( var i = temp.length - 1; i >= 0; i-- )
      adobe.Jsan.includePath.unshift(temp[i]);
   return adobe.Jsan;
}

adobe.Jsan._flatten = function( list1 ) {
   var list2 = new Array();
   for ( var i = 0; i < list1.length; i++ ) {
      if ( typeof list1[i] == 'object' ) {
         list2 = adobe.Jsan._flatten( list1[i], list2 );
      }
      else {
         list2.push( list1[i] );
      }
   }
   return list2;
};

adobe.Jsan._convertPathToUrl = function (path, repository) {
   return repository.concat('/' + path);
};


adobe.Jsan._convertPackageToPath = function (pkg) {
   var path = pkg.replace(/\./g, '/');
   path = path.concat('.js');
   return path;
}

adobe.Jsan._parseUseArgs = function () {
   var pkg        = arguments[0];
   var importList = [];
   
   for (var i = 1; i < arguments.length; i++)
      importList.push(arguments[i]);
   
   return {
      pkg:        pkg,
      importList: importList
   }
}

adobe.Jsan._loadJSFromUrl = function (url) {
   return new adobe.Jsan.Request().getText(url);
}

adobe.Jsan._findExportInList = function (list, request) {
   if (list == null) return false;
   for (var i = 0; i < list.length; i++)
      if (list[i] == request)
         return true;
   return false;
}

adobe.Jsan._findExportInTag = function (tags, request) {
   if (tags == null) return [];
   for (var i in tags)
      if (i == request)
         return tags[i];
   return [];
}

adobe.Jsan._exportItems = function (classdef, importList) {
   var exportList  = new Array();
   var EXPORT      = classdef.EXPORT;
   var EXPORT_OK   = classdef.EXPORT_OK;
   var EXPORT_TAGS = classdef.EXPORT_TAGS;
   
   if (importList.length > 0) {
      importList = adobe.Jsan._flatten( importList );
      
      for (var i = 0; i < importList.length; i++) {
         var request = importList[i];
         if (   adobe.Jsan._findExportInList(EXPORT,    request)
            || adobe.Jsan._findExportInList(EXPORT_OK, request)) {
            exportList.push(request);
            continue;
         }
         var list = adobe.Jsan._findExportInTag(EXPORT_TAGS, request);
         for (var i = 0; i < list.length; i++) {
            exportList.push(list[i]);
         }
      }
   } else {
      exportList = EXPORT;
   }
   adobe.Jsan._exportList(classdef, exportList);
}

adobe.Jsan._exportList = function (classdef, exportList) {
   if (typeof(exportList) != 'object') return null;
   for (var i = 0; i < exportList.length; i++) {
      var name = exportList[i];
      
      if (adobe.Jsan.globalScope[name] == null)
         adobe.Jsan.globalScope[name] = classdef[name];
   }
}

adobe.Jsan._makeNamespace = function(js, pkg) {
   var spaces = pkg.split('.');
   var parent = adobe.Jsan.globalScope;
   eval(js);
   var classdef = eval(pkg);
   for (var i = 0; i < spaces.length; i++) {
      var name = spaces[i];
      if (i == spaces.length - 1) {
         if (typeof parent[name] == 'undefined') {
            parent[name] = classdef;
            if ( typeof classdef['prototype'] != 'undefined' ) {
               parent[name].prototype = classdef.prototype;
            }
         }
      } else {
         if (parent[name] == undefined) {
            parent[name] = {};
         }
      }
      
      parent = parent[name];
   }
   return classdef;
}

adobe.Jsan._handleError = function (msg, level) {
   if (!level) level = adobe.Jsan.errorLevel;
   adobe.Jsan.errorMessage = msg;
   
   switch (level) {
      case "none":
         break;
      case "warn":
         alert(msg);
         break;
      case "die":
      default:
         throw new Error(msg);
         break;
   }
}

adobe.Jsan._createScript = function (js, pkg) {
   try {
      return adobe.Jsan._makeNamespace(js, pkg);
   } catch (e) {
      adobe.Jsan._handleError("Could not create namespace[" + pkg + "]: " + e);
   }
   return null;
}


adobe.Jsan.prototype = {
   use: function () { adobe.Jsan.use.apply(adobe.Jsan, arguments) }
};


// Low-Level HTTP Request
adobe.Jsan.Request = function (jsan) {
   if (adobe.Jsan.globalScope.XMLHttpRequest) {
      this._req = new XMLHttpRequest();
   } else {
      this._req = new ActiveXObject("Microsoft.XMLHTTP");
   }
};

adobe.Jsan.Request.prototype = {
   _req:  null,
   
   getText: function (url) {
      this._req.open("GET", url, false);
      try {
         this._req.send(null);
         if (this._req.status == 200 ||
            this._req.status == 0)
            return this._req.responseText;
      } catch (e) {
         adobe.Jsan._handleError("File not found: " + url);
         return null;
      };
      
      adobe.Jsan._handleError("File not found: " + url);
      return null;
   }
};

Object.extend(adobe, {
   /*----------------------------------------------------------------
    
    Method: use
    
    >	adobe.use("adobe.foo")
    
    Parameters:
    namespace - string
    
    Returned Value:
    Class reference
    
    Delegate for:
    <http://www.openjsan.org/src/c/cw/cwest/JSAN-0.08/doc/html/JSAN.html>
    
    ----------------------------------------------------------------*/
   use: adobe.Jsan.use,
   /*----------------------------------------------------------------
    
    Method: addRepository
    
    >	adobe.addRepository("/path/to/repository");
    
    Parameters:
    path - string
    
    Returned Value:
    JSAN Object reference
    
    Delegate for:
    <http://www.openjsan.org/src/c/cw/cwest/JSAN-0.08/doc/html/JSAN.html>
    
    ----------------------------------------------------------------*/
   addRepository: adobe.Jsan.addRepository,
   /*----------------------------------------------------------------
    
    Method: setLoaded
    
    >	adobe.setLoaded(adobe.foo, adobe.PATH+"adobe/foo.js")
    
    Parameters:
    module - object reference
    file - string
    
    Returned Value:
    None
    
    Delegate for:
    <http://www.openjsan.org/src/c/cw/cwest/JSAN-0.08/doc/html/JSAN.html>
    
    ----------------------------------------------------------------*/
   setLoaded: function(module, file) {
      adobe.Jsan.loaded[file] = module;
   }
});

adobe.addRepository(adobe.DIR);
adobe.setLoaded(adobe, adobe.FILE);

/*----------------------------------------------------------------
 
 Asset Linking
 
 ----------------------------------------------------------------*/

/*	ASSET LOADER $Revision: #1 $
 Work in progress
 @author btapley
 */

/*
 Class: Loader
 Load assets into the document, prevent overlapping assets form being written more than once.
 
 Example:
 >	adobe.Loader.requireAsset("/path/to/my/file.js");
 >	adobe.Loader.requireAsset("_/library_path/to/my/file.css");
 >	adobe.Loader.requireAsset("/path/to/my/file_print.css", { media: "print" });
 */

adobe.Loader = (function() {
   var ATTR_TOKEN = "#ATTR#",
       STATUS_NONE = 0,
       STATUS_DONE = 1,
       STATUS_ERROR = 2,
       SRC_PATH_TRIG = "_/",
       PATH_CAPTURE = /(^.+\.)(\w+)(\?[^$]*$|$)/,
       SCRIPT_TAG = "<script #ATTR#><\/script>",
       LINK_TAG = "<link #ATTR# \/>",
       jscompress = !!adobe.jscompress,
       compress_path = adobe.jscompress_path,
       renderStatus = {},
       assets = {
          JS: [ SCRIPT_TAG, "src", {
             type:"text/javascript"
          }],
          CSS: [ LINK_TAG, "href", {
             type:"text/css",
             rel:"stylesheet"
          }]
       },
       renderAsset = function(path, user_attributes) {
          var explode = path.match(PATH_CAPTURE), //break apart the path argument
              ext = explode[2], //file extension
              q = explode[3]; //query
      
          if(!ext) { return; } //didn't find a suitable file extension?
      
          var type = ext.toUpperCase(), //declare file type
              data = assets[type]; //declare data point
      
          if(!data) { return; } //is asset type defined in here?
      
          /* compression hack here. Still implementing server compression */
          if(type == "JS" && jscompress) {
             path = explode[1] + compress_path + "." + ext + q;
          }
      
          var out = {},
              attrs = [],
              attrN = "",
              code = data[0],
              pathAtt = data[1],
              reqAtt = data[2];
      
          for(attrN in reqAtt) { //copy required attributes
             out[attrN] = reqAtt[attrN];
          }
      
          out[pathAtt] = path; //set path attribute
      
          if(user_attributes) { //copy user-defined attributes
             for(attrN in user_attributes) {
                out[attrN] = user_attributes[attrN];
             }
          }
      
          for(attrN in out) { //create attribute text eg. name="value"
             attrV = out[attrN];
             attrs.push((attrV) ? (attrN + '="' + attrV + '"') : attrN);
          }
      
          return code.replace(ATTR_TOKEN, attrs.join(" "));
       };
   
   return {
      /*
       Function: requireAsset
       
       Parameters:
       path - location string (Paths beginning with "_/" will be relative to the library location)
       user_attributes - object instance (optional)
       
       Returns:
       Integer indicating render status (0=None, 1=Done, 2=Error)
       */
      
      requireAsset : function(path, user_attributes) {
         if(!path) { return STATUS_NONE; } //insurance from bad calls
         
         if(path.indexOf(SRC_PATH_TRIG) === 0) { //did we request a library relative path?
            path = path.replace(SRC_PATH_TRIG, adobe.PATH); //replace the trigger with the path
         }
         
         var currentStatus = (renderStatus[path] || STATUS_NONE); //declare status?
         
         if(currentStatus > STATUS_NONE) { return currentStatus; } //this path was already written, terminally failed, or in progress?
         
         var txt = renderAsset(path, user_attributes);
         
         if(!txt) {
            return (renderStatus[path] = STATUS_ERROR);
         } else {
            renderStatus[path] = currentStatus = STATUS_DONE; //new request, log it before writing to prevent recursion
         }
         
         document.write(txt);
         
         return currentStatus;
      },
      setLoaded: function(path) {
         renderStatus[path] = STATUS_DONE;
      }
   };
})();

Object.extend(adobe, {
   /*----------------------------------------------------------------
    
    Method: link
    
    >	adobe.link("path/to/file.css", {media:"screen"})
    
    Parameters:
    path - relative path from adobe.js file as string
    params - hash
    
    Returned Value:
    0 = Nothing, 1 = Done, 2 = Error
    
    ----------------------------------------------------------------*/
   link: adobe.Loader.requireAsset.wrap(function($proceed, path, params) {
      $proceed(adobe.PATH + path, params);
   }),
   /*----------------------------------------------------------------
    
    Method: setLinked
    
    >	adobe.setLinked("/path/to/file.css")
    
    Parameters:
    path - relative path from adobe.js file as string
    
    Returned Value:
    None
    
    ----------------------------------------------------------------*/
   setLinked: adobe.Loader.setLoaded.wrap(function($proceed, path) {
      $proceed(adobe.PATH + path);
   })
});

/* 	DEVICE_DETECTION2.JS
 $Id: //depot/projects/dylan/releases/rc_16_11_1/ubi/template/identity/device_detection2.js#1 $
 
 This library is designed to give you three pieces of information:
 
 a. info.device -- the name/ID of the specific device: e.g. "Motorola Droid"
 b. info.os -- the name/ID of the operating system, e.g. "Android"
 c. info.category -- what class of device this is (mobile, tablet, desktop, appliance, etc.)
 */

/* version 0.9
 4/16/2010 - ABE
 added winOSFamily to desktopDeviceCategory
 changed categories sequence to detect desktops first -- and will set deviceCategory=unknownDeviceCategory.id if no match can be found.
 */

/* TODO: incorporate all known desktop OS's  --> good resource is http://www.geekpedia.com/code47_Detect-operating-system-from-user-agent-string.html */
/*
 'Windows 3.11' => 'Win16',
 'Windows 95' => '(Windows 95)|(Win95)|(Windows_95)',
 'Windows 98' => '(Windows 98)|(Win98)',
 'Windows 2000' => '(Windows NT 5.0)|(Windows 2000)',
 'Windows XP' => '(Windows NT 5.1)|(Windows XP)',
 'Windows Server 2003' => '(Windows NT 5.2)',
 'Windows Vista' => '(Windows NT 6.0)',
 'Windows 7' => '(Windows NT 7.0)',
 'Windows NT 4.0' => '(Windows NT 4.0)|(WinNT4.0)|(WinNT)|(Windows NT)',
 'Windows ME' => 'Windows ME',
 'Open BSD' => 'OpenBSD',
 'Sun OS' => 'SunOS',
 'Linux' => '(Linux)|(X11)',
 'Mac OS' => '(Mac_PowerPC)|(Macintosh)',
 'QNX' => 'QNX',
 'BeOS' => 'BeOS',
 'OS/2' => 'OS/2',
 */

/* Copyright (c) 2010 Adobe Systems Incorporated. * All rights reserved. * Permission is hereby granted, free of charge, to any person obtaining * a copy of this software and associated documentation files (the "Software"), * to deal in the Software without restriction, including without limitation * the rights to use, copy, modify, merge, publish, distribute, sublicense, * and/or sell copies of the Software, and to permit persons to whom the * Software is furnished to do so, subject to the following conditions: * The above copyright notice and this permission notice shall be included in * all copies or substantial portions of the Software. * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE * SOFTWARE. */

//	var droidDeviceProfile = {id:"Motorola Droid",frag:/droid build/};
//	var nexusDeviceProfile =  {id:"Google Nexus One",frag:/nexus one build/i};
//	var palmPreDeviceProfile = {id:"Palm Pre", frag:/525.27.1 pre/i};

var droidDeviceProfile = {id:"Motorola Droid",frag:/droid build/};
var nexusDeviceProfile =  {id:"Google Nexus One",frag:/Android 2/i};
var palmPreDeviceProfile = {id:"Palm Pre", frag:/525.27.1 pre/i};
var genericAndroid2DeviceProfile = {id:"Generic Android 2 device", frag:/Android 2/i};
var genericAndroid1DeviceProfile = {id:"Generic Android 1 device", frag:/Android 1/i};
var genericWebOSDeviceProfile = {id:"genericWebOS Device", frag:/webos/i};

var win311DeviceProfile = {id:"Windows 3.11",frag:/win16/i};
var win95ADeviceProfile = {id:"Windows 95",frag:/windows 95/i};
var win95BDeviceProfile = {id:"Windows 95",frag:/win95/i};
var win95CDeviceProfile = {id:"Windows 95",frag:/win_95/i};
var win2000ADeviceProfile = {id:"Windows 2000",frag:/windows 2000/i};
var win2000BDeviceProfile = {id:"Windows 2000",frag:/windows nt 5.0/i};

var winServer2003DeviceProfile = {id:"Windows Server 2003",frag:/windows nt 5.2/i};

var winNT40ADeviceProfile = {id:"Windows NT 4.0",frag:/windows nt 4.0/i};
var winNT40BDeviceProfile = {id:"Windows NT 4.0",frag:/winnt/i};
var winNT40CDeviceProfile = {id:"Windows NT 4.0",frag:/windows nt/i}; // need to make sure this gets processed last as it would otherwise prevent correct id
// of windows 2000 for example or replace with regular expression that is more strict.

var winmeDeviceProfile = {id:"Windows ME",frag:/windows me/i};

var openBSDDeviceProfile = {id:"OpenBSD",frag:/openbsd/i};
var sunOSDeviceProfile = {id:"Sun OS",frag:/sunos/i};
var linuxADeviceProfile = {id:"Linux",frag:/linux/i};
var linuxBDeviceProfile = {id:"Linux",frag:/x11/i};
var QNXDeviceProfile = {id:"QNX",frag:/qnx/i};
var beosDeviceProfile = {id:"BeOS",frag:/beos/i};
var os2DeviceProfile = {id:"OS2",frag:/OS\/2/i};

var winxpDeviceProfile = {id:"Windows XP",frag:/windows xp/i};
var winxp2DeviceProfile = {id:"Windows XP",frag:/windows nt 5.1/i};
var win7ADeviceProfile = {id:"Windows 7",frag:/windows nt 6.1/i};
var win7BDeviceProfile = {id:"Windows 7",frag:/windows nt 7.01/i};
var winvistaDeviceProfile = {id:"Windows Vista",frag:/windows nt 6.0/i};

var macosx106DeviceProfile =  {id:"Snow Leopard",frag:/mac os x 10.6/i};
var macosx105DeviceProfile =  {id:"Leopard",frag:/mac os x 10.5/i};
var macosA = {id:"Mac OS",frag:/mac_powerpc/i};
var macosB = {id:"Mac OS",frag:/macintosh/i};

/* OPERATING SYSTEMS */

var androidOSFamily = {id:"Android OS",frag:/android /i,devices:[droidDeviceProfile,nexusDeviceProfile,genericAndroid1DeviceProfile,genericAndroid2DeviceProfile]};

var webOSFamily = {id:"webOS",frag:/webOS\/1.3.5/i,devices:[palmPreDeviceProfile, genericWebOSDeviceProfile]};

var macOSFamily = {id:"Mac OS",frag:/mac os/i,devices:[macosx105DeviceProfile,macosx106DeviceProfile,macosA, macosB]};

var winOSFamily = {id:"Windows",frag:/windows/i,devices:[winxpDeviceProfile,winxp2DeviceProfile,win7ADeviceProfile,win7BDeviceProfile,winvistaDeviceProfile,win311DeviceProfile,win95ADeviceProfile,win95BDeviceProfile,win95CDeviceProfile,winServer2003DeviceProfile,winNT40ADeviceProfile,winNT40BDeviceProfile,winNT40CDeviceProfile,winmeDeviceProfile]};

var linuxOSFamily = {id:"Linux",frag:/linux/i,devices:[openBSDDeviceProfile,sunOSDeviceProfile,linuxADeviceProfile, linuxBDeviceProfile, QNXDeviceProfile,beosDeviceProfile,os2DeviceProfile]};

/* CATEGORIES */

var desktopDeviceCategory = {id:"Desktop",osFamilies:[macOSFamily,winOSFamily,linuxOSFamily]};

var mobileDeviceCategory = {id:"Mobile",osFamilies:[androidOSFamily,webOSFamily]};

var unknownDeviceCategory = {id:"Unidentified Platform"};

var categories = [mobileDeviceCategory,desktopDeviceCategory /*,mobileDeviceCategory*/];

/*
 function StringBuffer() {
 this.__strings__ = new Array;
 }
 
 StringBuffer.prototype.append = function (str) {
 this.__strings__.push(str);
 };
 
 StringBuffer.prototype.toString = function () {
 return this.__strings__.join("");
 };
 
 
 function isdefined( variable)
 {
 return (typeof(window[variable]) == "undefined")?  false: true;
 }
 
 function displayOrientation() {
 var err = "";
 try {
 var c = context;
 
 
 if(isDefined(context)) {
 if(isDefined(context.getResources())) {
 if(isDefined(context.getResources().getConfiguration())) {
 var orientation= context.getResources().getConfiguration();
 if(isdefined(orientation)) {
 
 document.write("orientation: "+orientation);
 } else {
 err = "no orientation";
 }
 } else {
 err = "no configuration";
 }
 } else {
 err = "no resources";
 }
 } else {
 err = "no context";
 }
 mylog("err: "+err);
 } catch (e) {
 mylog("no display orientation data available");
 return;
 }
 
 
 }
 
 function mylog(s) {
 document.write('<div style="color:grey">'+s+'</div>');
 }
 
 function dumpDeviceInfo() {
 var buf;
 // 	document.write('<div style="color:white">checkpoint dump1</div>');
 try {
 var Build = android.os.Build;
 if(isdefined(Build)) {
 // 	document.write('<div style="color:white">checkpoint dump2</div>');
 buf = new StringBuffer();
 buf.append("VERSION.RELEASE {"+Build.VERSION.RELEASE+"}");
 buf.append("\nVERSION.INCREMENTAL {"+Build.VERSION.INCREMENTAL
 +"}");
 buf.append("\nVERSION.SDK {"+Build.VERSION.SDK+"}");
 buf.append("\nBOARD {"+Build.BOARD+"}");
 buf.append("\nBRAND {"+Build.BRAND+"}");
 buf.append("\nDEVICE {"+Build.DEVICE+"}");
 buf.append("\nFINGERPRINT {"+Build.FINGERPRINT+"}");
 buf.append("\nHOST {"+Build.HOST+"}");
 buf.append("\nID {"+Build.ID+"}");
 
 mylog("build:"+buf);
 }
 } catch(e) {
 //			document.write('<div style="color:white">checkpoint dump3</div>');
 mylog("no device info available");
 return;
 }
 }
 
 */

function identifyDevice(d,ua) {
   //		document.write('<div style="color:white">'+d.frag+' =? '+ua+'</div>');
   if (ua.search(d.frag) > -1) {
      //			document.write('<div style="color:white">MATCH!</div>');
      return {device:d.id};
   } else
      return null;
}

function identifyOS(os,ua) {
   var deviceInfo=null;
   var olen = os.devices.length;
   for(var k=0;k<olen;k++) {
      deviceInfo = identifyDevice(os.devices[k],ua);
      if(deviceInfo!=null) break;
   }
   if(deviceInfo!=null) deviceInfo.os = os.id;
   return deviceInfo;
}

function identifyCategory(cat,ua) {
   var osInfo=null;
   var jlen = cat.osFamilies.length;
   for(var j=0;j<jlen;j++) {
      osInfo = identifyOS(cat.osFamilies[j],ua);
      if(osInfo!=null) break;
   }
   if(osInfo!=null) osInfo.category = cat.id;
   return osInfo;
}

function identifyCategories(cats,ua) {
   var categoryInfo=null;
   var clen = cats.length;
   for(var i=0;i<clen;i++) {
      categoryInfo = identifyCategory(cats[i],ua);
      if(categoryInfo!=null) break;
   }
   
   if(!categoryInfo) categoryInfo = {};
   if(!categoryInfo.device) categoryInfo.device='unknown';
   if(!categoryInfo.os) categoryInfo.os = 'unknown';
   if(!categoryInfo.category) categoryInfo.category = unknownDeviceCategory.id;
   return categoryInfo;
}


// external method
// returns an object that should contain
//		category (such as 'Desktop' or 'Mobile'
//		os			(such as 'Windows', 'Mac OS', 'Android', etc.
//		device		(such as 'Windows XP','Android', etc.

// TBD:
//		osversion
//		carrier
//		deviceregion

function getCategoriesInfo() {
   return identifyCategories(categories, navigator.userAgent.toLowerCase());
}

function displayCategoriesInfo() {
   alert('isDesktop:'+isDesktop()  + ', os:' + info.os + ', device:' + info.device);
}

function isDroid() {
   return (info.device==droidDeviceProfile.id);
}

function isNexus() {
   return(info.device==nexusDeviceProfile.id);
}

function isDesktop() {
   return(info.category==desktopDeviceCategory.id);
}

function isLinuxDesktop() {
   return(info.os==linuxOSFamily.id);
}


function isWinDesktop() {
   return(info.os==winOSFamily.id);
}

function isMacDesktop() {
   return(info.os==macOSFamily.id);
}

function simulateDroid() {
   info.device = droidDeviceProfile.id;
   info.category = mobileDeviceCategory.id;
   info.os = androidOSFamily.id;
}

var info = getCategoriesInfo();
//simulateDroid();
if(isDesktop() != true ) {
   adobe.Loader.requireAsset("/ubi/template/identity/adobe/screen/gnavMobileFix.css", { media: "screen" });
}
/*////////////////////////////////////////////////////////////////
 @author btapley
 @author mhurdka
 
 $Id: //depot/projects/dylan/releases/rc_16_11_1/ubi/template/identity/adobe/hostEnv.js#1 $
 
 Method: hostEnv
 
 Function:
 Simple host profile. Be warned, I've tried to avoid user-agent detection as much as possible but there is some here.
 
 Properties:
 name - hostname
 isSecure - boolean for https protocal
 appN - application name
 appV - application version number
 ua - user-agent id as string
 plt - platform id as string
 lang - browser langauge
 hasActiveX - boolean for ActiveX support
 ie6 - have to check UA because of IE6 SP3 changing JSCRIPT and IEV to be 7 anyway
 ieV - like appV but more general eg. 5, 5.5, 6, 7
 isSafari - boolean for apple web kit
 kitV - webkit version number
 
 ////////////////////////////////////////////////////////////////*/

/*@cc_on; @*/
adobe.hostEnv = (function() {
   var ua = new String(navigator.userAgent.toLowerCase()), //using new to speed up the many method calls below
       appV = parseInt(navigator.appVersion, 0),
       isSafari = ua.indexOf('safari') != -1,
       kitV = 0;
   
   if(isSafari) {
      var wk = 'applewebkit/',
          kitpos = ua.indexOf(wk);
      
      if(kitpos > -1) {
         var kit = ua.substring(kitpos+wk.length);
         kit = kit.substring(0,kit.indexOf(" "));
         kitV = parseInt(kit, 0);
      }
   }
   
   if(ua.indexOf('opera/7') != -1 || ua.indexOf('opera 7') != -1) { appV = 7; }
   
   var ie6 = (ua.indexOf("msie 6.0") > -1) ? true : false;
   var ie =  (ua.indexOf("msie") > -1) ? true : false;
   
   var env = {
      "name":		window.location.hostname,
      "isSecure":	window.location.protocal == "https:",
      "appN":		navigator.appName.toLowerCase(),
      "appV":		appV,
      "ua":		ua,
      "plt":		navigator.platform.toLowerCase(),
      "lang":		(navigator.language || navigator.userLanguage).substring(0,2),
      "ax":		typeof window.ActiveXObject != "undefined",
      "ie":		ie,
      "ie6":		ie6,
      "ieV":		(function() {
         /*@
          @if (@_jscript_version >= 5 && @_jscript_version < 5.5) { return 5; } @end;
          @if (@_jscript_version >= 5.5 && @_jscript_version < 5.6) { return 5.5; } @end;
          @if (@_jscript_version >= 5.6 && @_jscript_version < 5.7) { return 6; } @end;
          @if (@_jscript_version >= 5.7 && @_jscript_version < 5.8) { return 7; } @end;
          @if (@_jscript_version >= 5.8 && @_jscript_version < 5.9) { return 8; } @end;
          @*/
         return 0;
      })(),
      "isSafari": isSafari,
      "kitV":		kitV
   };
   
   return env;
})();
/*-------------------------------------------------------------------------------
 
 Namespace: u
 Utility methods
 
 -------------------------------------------------------------------------------*/

adobe.u = {
   /*-------------------------------------------------------------------------------
    
    Function: nonEvent
    Non propagating event
    
    Parameters:
    event - Event instance
    
    Returned Value:
    None
    
    Example:
    >	Event.observe("foo", "click", adobe.u.nonEvent);
    
    -------------------------------------------------------------------------------*/
   nonEvent: function (event) {
      return event.stop();
   },
   /*-------------------------------------------------------------------------------
    
    Function: pixelate
    Append "px" to a number
    
    Parameters:
    integer - integer
    
    Returned Value:
    string
    
    Example:
    >	adobe.u.pixelate(1);
    
    -------------------------------------------------------------------------------*/
   pixelate: function(integer) {
      return parseInt(integer)+"px";
   },
   /*-------------------------------------------------------------------------------
    
    Function: getSearchParam
    Get a value defined in the uri search parameter by it's id or all parameters in a hash.
    
    Parameters:
    id(optional) - string
    
    Returned Value:
    string or hash
    
    Example:
    >	adobe.u.getSearchParam("foo");
    
    -------------------------------------------------------------------------------*/
   getSearchParam: (function() {
      var _loadedParams;
      return function(id) {
         var params = _loadedParams ||
            (_loadedParams = window.location.search.toQueryParams());
         return (id) ? params[id] : params;
      }
   })(),
   /*-------------------------------------------------------------------------------
    
    Function: freshenLocation
    Create a location string that would force a browser to check cache.
    
    Parameters:
    uri - string
    param (optional) - string
    
    Returned Value:
    string
    
    Example:
    >	adobe.u.freshenLocation("/path"[, "myParam"])
    
    -------------------------------------------------------------------------------*/
   freshenLocation: function(uri, param) {
      var query = "?",
          param = param || "time",
          i = uri.indexOf(query),
          time = query + param + "=" + new Date().getTime();
      
      if(i==-1) {
         return (uri + time);
      } else {
         var parts = adobe.u.unfreshenLocation(uri, param).split("?");
         return parts.join(time + ((parts[parts.length-1] == "") ? "" : "&"));
      }
   },
   /*-------------------------------------------------------------------------------
    
    Function: unfreshenLocation
    Remove the query set by <freshenLocation> from a uri string
    
    Parameters:
    uri - string
    param (optional) - string
    
    Returned Value:
    string
    
    Example:
    >	adobe.u.unfreshenLocation("/path"[, "myParam"])
    
    
    -------------------------------------------------------------------------------*/
   unfreshenLocation: function(uri, param) {
      var expression = new RegExp("([\\?&]?)"+(param||"time")+"=\\d*&?", "g");
      return uri.replace(expression, "$1");
   },
   /*-------------------------------------------------------------------------------
    
    Function: revolve
    move the position of array items by specified number, wrapping items and keeping the length the same.
    
    Parameters:
    arr - Array instance
    integer - position or negative integer
    
    Returned Value:
    Array instance passed in
    
    Example:
    >	adobe.u.revolve(["a","b","c"], -1)
    
    -------------------------------------------------------------------------------*/
   revolve: function(arr, integer) {
      arr.unshift.apply(arr, arr.splice(integer, arr.length));
      return this;
   },
   /*-------------------------------------------------------------------------------
    
    Function: toInt
    Convert a string to an integer
    
    Parameters:
    str - String instance
    
    Returned Value:
    integer
    
    Example:
    >	adobe.u.toInt("1")
    
    -------------------------------------------------------------------------------*/
   toInt: function(str) {
      return parseInt(str);
   }
};

/*-------------------------------------------------------------------------------
 
 Method: toInt
 
 Returned Value:
 integer
 
 Example:
 >	("1").toInt();
 
 -------------------------------------------------------------------------------*/

String.prototype.toInt = function() {
   return parseInt(this);
}

/*-------------------------------------------------------------------------------
 
 Method: pixelate
 Append "px" to a number
 
 Returned Value:
 string
 
 Example:
 >	(1).pixelate();
 
 -------------------------------------------------------------------------------*/

Number.prototype.pixelate = function() {
   return this + "px";
}

Object.extend(Array.prototype, {
   revolve: function(integer) {
      this.unshift.apply(this, this.splice(integer, this.length));
      return this;
   }
});
