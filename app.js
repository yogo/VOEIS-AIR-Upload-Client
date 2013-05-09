      //var base_url = "https://voeis.msu.montana.edu";
      var base_url = "http://localhost:3000";
      var api_key= "";
      var db = null;
      var stmt = null;
      //var NONE = −1;
      var CREATE_SCHEMA = 0;
      var INSERT_DATA = 1;
      var DELETE_TASK = 2;
      var state = -1;
      
      // fetch_api_key
      // Get the API Key for a username and password combination from VOEIS and save it to the database
      //
      // @author: Sean Cleveland
      // @updated: 2012/07/02
      function fetch_api_key(){
       //alert($('#login').val()+":"+$('#password').val()); 
       $.get(base_url+"/user_session/get_api_key.json?user_session[login]="+$('#login').val()+"&user_session[password]="+$('#password').val(),
           function(data){
             //alert("Data Loaded: " + data['api_key']);
             api_key = data['api_key'];
             //Remove any old API Keys
             stmt.text = 'DELETE FROM api_key';
             stmt.execute();
             //Save new API Key to database
             stmt.text = 'INSERT INTO api_key ("api_key", "user") VALUES (' +'\''+api_key+'\', ' + '\'' + $('#login').val() + '\')';
             stmt.execute();
             alert($('#login').val() + "has been logged in.")
             $('#login_div').hide();
             getUserProjects();
             $('#add_project_div').show();
           }).error(function(){alert("Failed to connect with VOEIS service.")});
      }
      
      // doDbOpen
      // Set up the database and tables if they do not already exist
      //
      // @author: Sean Cleveland
      // @update: 2012/6/19
      function doDbOpen( event )
      {
         stmt = new air.SQLStatement();
         stmt.addEventListener( air.SQLErrorEvent.ERROR, 
              doStmtError );
         stmt.addEventListener( air.SQLEvent.RESULT, doStmtResult );
            stmt.sqlConnection = db;
            stmt.text = 'CREATE TABLE IF NOT EXISTS uploads ( ' +
                                'id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
                                'project_id TEXT, ' +
                                'site_id INTEGER, ' +
                                'template_id INTEGER, ' + 
                                'time INTEGER, ' +
                                'last_upload INTEGER, ' +
                                'file Text)';
            stmt.execute();
            stmt.text = 'CREATE TABLE IF NOT EXISTS api_key ( ' +
                                'api_key Text, ' +
                                'user Text)';
            stmt.execute();
       }
      
       // doLoad
       // Connect to the SQLite3 database and set it up then check if a user already exists
       //
       // @author: Sean Cleveland
       // @updated: 2012/7/2     
       function doLoad()
       {
          var file = air.File.applicationDirectory.resolvePath(
       'voeis_upload.db' );
          db = new air.SQLConnection();
          db.addEventListener( air.SQLEvent.OPEN, doDbOpen );
          db.open( file, air.SQLMode.CREATE );
          
          var name_results = null;
          stmt.text = 'SELECT * FROM api_key'
          stmt.execute();
          name_results = stmt.getResult();
          if (name_results.data[0] == null){
            $('#login_div').show();
          }
          else{
            $('#login_div').hide();
            $('#current_user').html("Hello: " + name_results.data[0].user); 
          }
       }
       
       // doStmtError
       // If there is a database query error show the user the error message
       //
       // @author: Sean Cleveland
       // @updated: 2012/6/19
       function doStmtError( event )
       {
          alert( 'There has been a problem executing a statement:\n' + event.error.message );
       }
       
       // doSave
       // Saves a new upload task record into the database
       //
       // @author: Sean Cleveland
       // @updated: 2012/6/19
       function doSave()
       {
           var project_id = $('#project_id' ).val();
           var site_id = $('#site_id' ).val();
           var template_id = $('#template_id').val();
           var time = $('#time').val();
           var file = $('#file').val();
           stmt.text = 'INSERT INTO uploads ("project_id","site_id","template_id","time","file") VALUES ( ' +
                               '\'' + project_id + '\', '+ site_id + ', ' + template_id + ', ' + 
                               time + ', ' +
                               '\'' + file + '\')';
           state = INSERT_DATA;
           stmt.execute();
       }
       
       // doStmtResult
       // Defines the set of things to do when a database task is completed
       //
       // @author: Sean Cleveland
       // @updated: 2012/7/2
       function doStmtResult( event )
       {
           switch( state )
           {
                case CREATE_SCHEMA:
                     alert( 'The database table has been created.' );
                     state = -1;
                     break;
                case INSERT_DATA:
                     state = -1;
                     $('#project_id' ).val("");
                     $('#site_id' ).val("");
                     e_id = $('#template_id').val("");
                     $('#time').val("");
                     $('#file').val("");
                     getProjectTasks();
                     alert( 'A new record has been stored.' );
                     break;
                case DELETE_TASK: 
                     state = -1;
                     getProjectTasks(); 
                     alert("Task Deleted");
                     break;
           }
       }
      
      // getProjectTasks
      // Fetch all the upload tasks from the database and appends them to the project_task_div
      //
      // @author: Sean Cleveland
      // @updated: 2012/7/2
      function getProjectTasks(){
        var results = null;
        stmt.text = 'SELECT * FROM uploads'
        stmt.execute();
        results = stmt.getResult();
        $('#project_tasks_div').empty();
        $('#project_tasks_div').html("No Upload Tasks Exist.");
        if( results.data != null )
            {
                 $('#project_tasks_div').empty();
                 for( var c = 0; c < results.data.length; c++ )
                 {
                      $('#project_tasks_div').html($('#project_tasks_div').html() +'<p>Project ID: '+ results.data[c].project_id +
                        '<br/>Filename: '+results.data[c].file+'<button onClick="deleteProjectTask('+results.data[c].id.toString()+')">Delete Upload Task</button></p>')
                 }
            }
      }
      
      // deleteProjectTask
      // Removes an upload task from the database
      //
      // @author: Sean Cleveland
      // @updated: 2012/7/2
      function deleteProjectTask(task_id){
        stmt.text = 'DELETE FROM uploads WHERE id=' + task_id;
        state = DELETE_TASK;
        stmt.execute();
      }
      
      // uploadFiles
      // Attempts to upload all the files from the existing upload tasks in the databse to VOEIS
      //
      // @author: Sean Cleveland
      // @updated: 2012/7/2
      function uploadFiles(){
        var results = null;
        stmt.text = 'SELECT * FROM uploads'
        stmt.execute();
        results = stmt.getResult();
        alert(results.data);
        var name_results = null;
        stmt.text = 'SELECT * FROM api_key'
        stmt.execute();
        name_results = stmt.getResult();
        alert(name_results.data[0].api_key);
        
        if( results.data != null )
        {
          for( var c = 0; c < results.data.length; c++ )
           {
             //var variables = new.air.URLVariables();
             //variables.api_key = name_results.data[0].api_key;
             params = 'data_template_id='+results.data[c].template_id+'&site_id='+results.data[c].site_id;
             var url = base_url + '/projects/' + results.data[c].project_id + '/apivs/upload_data.json?api_key='+name_results.data[0].api_key;  
             var tmpRequest = new air.URLRequest(url);
             var datafile = new air.File(results.data[c].file);
             //tmpRequest = new air.URLRequest(base_url + results.data[c].project_id + '/apivs/upload_data.json?');
             tmpRequest.method = air.URLRequestMethod.POST;
             tmpRequest.contentType = 'multipart/form-data';   
             tmpRequest.data = params;
             //air.sendToURL(tmpRequest);
             //alert(url);
             // attach events for displaying progress bar and upload complete
             //datafile.addEventListener(air.ProgressEvent.PROGRESS, callback_for_upload_progress);
             datafile.addEventListener(air.DataEvent.UPLOAD_COMPLETE_DATA, callback_for_upload_finish); 

             // doing upload request to server
             datafile.upload(tmpRequest, 'datafile', false);
             //file.addEventListener(air.Event.COMPLETE, uploadComplete);
             //file.upload(request, file);    
           }
        }  
      }
      
      function callback_for_upload_progress(event) { 
          var loaded = event.bytesLoaded; 
          var total = event.bytesTotal; 
          var pct = Math.ceil( ( loaded / total ) * 100 ); 
          air.trace('Uploaded ' + pct.toString() + '%');
      }

      function callback_for_upload_finish(event) {
          //Console.log('File upload complete');
          //air.trace(event.data); // output of server response to AIR dev console
          alert(event.data); 
      }
      
      // getuserProjects
      // Fetchs a user's projects from VOEIS and populates the project select box for the upload task creation form
      //
      // @author: Sean Cleveland
      // @updated: 2012/7/2
      function getUserProjects(){
        $('#project_id').append($("<option></option>").attr("value","").text("Fetching Project List Please Wait.."));
        var name_results = null;
        stmt.text = 'SELECT * FROM api_key'
        stmt.execute();
        name_results = stmt.getResult();
        $.get(base_url+"/projects/get_user_projects.json?api_key="+name_results.data[0].api_key,
             function(data){
               if (data['errors'] == null){
                 $('#project_id').empty();
                 for( var c = 0; c < data.length; c++ )
                 {
                   $('#project_id')
                      .append($("<option></option>")
                      .attr("value",data[c]['id'])
                      .text(data[c]['name']));
                 }
               }
               else{
                 alert(data['errors']);
               }
             });
      }
      
      // getProjectSites
      // Fetchs the sites and populates the site selectbox after a project has been selected during the upload task creation process
      //
      // @author: Sean Cleveland
      // @updated: 2012/7/2
      function getProjectSites(){
        $('#site_id').attr("disabled","disabled");
        //.attr("value","")
        //.text("Loading Sites Please Wait...")).val("");
        var name_results = null;
        stmt.text = 'SELECT * FROM api_key'
        stmt.execute();
        name_results = stmt.getResult();
        $.get(base_url+"/projects/"+$('#project_id').attr("value")+"/sites.json?api_key="+name_results.data[0].api_key,
             function(data){
               if (data['errors'] == null){
                 $('#site_id').empty();
                 for( var c = 0; c < data.length; c++ )
                 {
                   $('#site_id')
                      .append($("<option></option>")
                      .attr("value",data[c]['id'])
                      .text(data[c]['name']));
                 }
                 $('#site_id')..attr("disabled","");
               }
               else{
                 alert(data['errors']);
               }
             });
      }
      
      // getProjectDataTemplates
      // Fetchs the data-templates and populates the template selectbox after a project has been selected during the upload task creation process
      //
      // @author: Sean Cleveland
      // @updated: 2012/7/2
      function getProjectDataTemplates(){
        var name_results = null;
        stmt.text = 'SELECT * FROM api_key'
        stmt.execute();
        name_results = stmt.getResult();
        $.get(base_url+"/projects/"+$('#project_id').attr("value")+"/data_streams.json?api_key="+name_results.data[0].api_key,
             function(data){
               if (data['errors'] == null){
                 $('#template_id').empty();
                 
                 for( var c = 0; c < data.length; c++ )
                 {
                   $('#template_id')
                      .append($("<option></option>")
                      .attr("value",data[c]['id'])
                      .text(data[c]['name']));
                 }
               }
               else{
                 alert(data['errors']);
               }
             });
      }
      
      function init_app(){
        stmt.text = 'SELECT * FROM api_key'
        stmt.execute();
        name_results = stmt.getResult();
        if (name_results[0]  == null){
          $('#login_div').toggle();
        }
        else{
          $('#current_user').html(name_results[0].user); 
        }
          
      }
