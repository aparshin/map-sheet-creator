use lib '..';

use Test::More;
use TimeManager;

#correct usage
ok( TimeManager::resetTimer('a') );
ok( TimeManager::resetTimer('a') );
is(TimeManager::getTimeMeasure('a'), 0.0);
ok( TimeManager::startTimer('a') );
ok( TimeManager::stopTimer('a') );
my $time1 = TimeManager::getTimeMeasure('a');
cmp_ok( $time1, '>', 0.0 );

ok( TimeManager::startTimer('a') );
ok( TimeManager::stopTimer('a') );
my $time2 = TimeManager::getTimeMeasure('a');
cmp_ok( $time2, ">", $time1 );

my $time3 = TimeManager::getTimeMeasure('a');
is($time3, $time2);
ok( TimeManager::resetTimer('a') );
is(TimeManager::getTimeMeasure('a'), 0.0);

#incorrect usage
ok( not TimeManager::resetTimer );
ok( not TimeManager::resetTimer('') );
ok( not TimeManager::startTimer('b') );
ok( not TimeManager::stopTimer('b') );
ok( not TimeManager::getTimeMeasure('b') );

ok( TimeManager::resetTimer('b') );
ok( not TimeManager::stopTimer('b') );
ok( TimeManager::startTimer('b') );
ok( not TimeManager::startTimer('b') );
ok( TimeManager::resetTimer('b') );

done_testing;