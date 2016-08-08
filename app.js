$(document).ready(function() {

    // hide the page in case there is an SSO session (to avoid flickering)
    document.body.style.display = 'none';

    // instantiate Lock
    var lock = new Auth0Lock('3iI4JkD8m43FYi1xDS1wSMqfhYeOAUNb', 'yves.eu.auth0.com');

    //this.lock.on('authenticated', this._doAuthentication.bind(this)); 
    //lock.on('authenticated', this._doAuthentication.bind(this)); 
    // sso requires redirect mode, hence we need to parse
    // the response from Auth0 that comes on location hash
    //var hash = lock.$auth0.parseHash(window.location.hash);
     var hash = lock.parseHash(window.location.hash);
    if (hash && hash.id_token) {
      // the user came back from the login (either SSO or regular login),
      // save the token
      localStorage.setItem('userToken', hash.id_token);
      // redirect to "targetUrl" if any
      // This would go to a different route like
      // window.location.href = hash.state || '#home';
      // But in this case, we just hide and show things
      goToHomepage(hash.state, hash.id_token);
      return;
    }

    // Get the user token if we've saved it in localStorage before
    var idToken = localStorage.getItem('userToken');
    if (idToken) {
      // This would go to a different route like
      // window.location.href = '#home';
      // But in this case, we just hide and show things
      goToHomepage(getQueryParameter('targetUrl'), idToken);
      return;
    }

    // user is not logged, check whether there is an SSO session or not
    lock.$auth0.getSSOData(function(err, data) {
      if (!err && data.sso) {
        // there is! redirect to Auth0 for SSO
        lock.$auth0.signin({
          // If the user wanted to go to some other URL, you can track it with `state`
          state: getQueryParameter('targetUrl'),
          callbackOnLocationHash: true,
          scope: 'openid name picture'
        });
      } else {
        // regular login
        document.body.style.display = 'inline';
      }
    });

    setInterval(function() {
      // if the token is not in local storage, there is nothing to check (i.e. the user is already logged out)
      if (!localStorage.getItem('userToken')) return;

      lock.$auth0.getSSOData(function(err, data) {
      // if there is still a session, do nothing
      if (err || (data && data.sso)) return;

      // if we get here, it means there is no session on Auth0,
      // then remove the token and redirect to #login
      localStorage.removeItem('userToken');
      window.location.href = '#login'

      });
    }, 5000)

    // Showing Login
    $('.btn-login').click(function(e) {
      e.preventDefault();
      lock.show({
        authParams: {
          scope: 'openid name picture'
        }
      });
    });


     

    // Sending token in header if available
    $.ajaxSetup({
      'beforeSend': function(xhr) {
        if (localStorage.getItem('userToken')) {
          xhr.setRequestHeader('Authorization',
                'Bearer ' + localStorage.getItem('userToken'));
        }
      }
    });

    

    function goToHomepage(state, token) {
      // Instead of redirect, we just show boxes
      document.body.style.display = 'inline';
      $('.login-box').hide();
      $('.logged-in-box').show();
       $('#logout').click(function(e) {
        console.log("In logout"); 
        logout(); 
     });
      var profile = jwt_decode(token);
      $('.name').text(profile.name);
      if (state) {
        $('.url').show();
        $('.url span').text(state);
      }
    }



  function logout() {
         localStorage.removeItem('userToken');
         localStorage.removeItem('profile');
         
          $('.login-box').show();
        $('.logged-in-box').hide();
        var req = new XMLHttpRequest();

        req.onreadystatechange = function() {
            var status;
           

            if (req.readyState == 4) { // `DONE`
              status = req.status;
              if (status == 200) {  
                console.log('the response is: ',req.responseText);
                 

              } else {
                alert(status); 
              }
            }
          }; 

          req.open('GET', "http://yves.eu.auth0.com/v2/logout", true);
        
          req.send();


    }

    function getQueryParameter(name) {
      name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
      var regex = new RegExp("[\\?&]" + name + "=([^&]*)"),
          results = regex.exec(location.search);
      return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    }


});
