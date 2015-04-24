App.info({
  id: 'tunesuggest.meteor.com',
  name: 'tunesuggest',
  description: 'music recommendation service',
  author: 'Matthew Sherman',
  email: '5h32m4n@gmail.com',
  website: 'http://tunesuggest.meteor.com/'
});

App.icons({
  'android_ldpi': 'public/ldpi-icon.png',
  'android_mdpi': 'public/mdpi-icon.png',
  'android_hdpi': 'public/hdpi-icon.png',
  'android_xhdpi': 'public/xhdpi-icon.png'
});

/*App.launchScreens({
  'android_ldpi_portrait': 'public/ldpi-screen.png',
  'android_ldpi_landscape': 'public/land-ldpi-screen.png',
  'android_mdpi_portrait': 'public/mdpi-screen.png'.
  'android_mdpi_landscape': 'public/land-mdpi-screen.png',
  'android_hdpi_portrait': 'public/hdpi-screen.png',
  'android_hdpi_landscape': 'public/land-hdpi-screen.png',
  'android_xhdpi_portrait': 'public/xhdpi-screen.png',
  'android_xhdpi_landscape': 'public/land-xhdpi-screen.png'
});*/

App.setPreference('LoadingDialog', 'Tune Suggest, Loading...');
App.setPreference('LoadingPageDialog', 'Tune Suggest, Loading...');