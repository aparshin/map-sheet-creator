use lib '..';

use Test::More;
use Logger;

# Test logger
my $logCount  = 0;
my $logCount2  = 0;
my $warnCount = 0;
my $errCount  = 0;

my $logger = new Logger();

is( scalar @{$logger->getLogs()},     0 );
is( scalar @{$logger->getWarnings()}, 0 );
is( scalar @{$logger->getErrors()},   0 );

$logger->addLogCallback(sub { $logCount++; } );
$logger->addLogCallback(sub { $logCount2++; } );
$logger->addLogCallback(sub { $warnCount++; } );
$logger->addLogCallback(sub { $errCount++; } );

$logger->log( "Log Message" );
is( $logCount, 1 );
is( $logCount2, 1 );
is( scalar @{$logger->getLogs()}, 1 );
is( $logger->getLogs()->[0], "Log Message" );

$logger->warning( "Warn Message" );
is( $warnCount, 1 );
is( scalar @{$logger->getWarnings()}, 1 );
is( $logger->getWarnings()->[0], "Warn Message" );

$logger->error( "Err Message" );
is( $errCount, 1 );
is( scalar @{$logger->getErrors()}, 1 );
is( $logger->getErrors()->[0], "Err Message" );

done_testing;