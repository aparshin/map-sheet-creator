use lib '..';

use Test::More;
use MapManager;

ok(not MapManager::isValidMapname('map'));
ok(MapManager::isValidMapname('slazav'));
ok(MapManager::isValidMapname('arbalet'));

is(MapManager::getTileFilename('slazav',1,2,13), '../../maps/slazav/Z13/2_1.png');
is(MapManager::getTileFilename('map',1,2,13), undef);

done_testing;