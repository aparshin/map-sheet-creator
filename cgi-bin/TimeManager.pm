package TimeManager;
# Package for time measurement
#
# Can make parallel measurements series identified by a string. 
# Usage sequence:
# (resetTimer+ -> (startTimer -> stopTimer)* -> getTimeMeasure*)*
# resetTimer can be called at any moment
# 
# getTimeMeasure returns time in seconds

use Time::HiRes;

my %m_timeMeasures;

# Usage: resetTimer(runID). ID can be any string
sub resetTimer
{
    return unless scalar @_ and $_[0];
    $m_timeMeasures{$_[0]} = {totalTime => 0.0, lastStart => undef};
    return 1;
}

# Usage: startTimer(runID)
sub startTimer
{
    return unless scalar @_ and exists $m_timeMeasures{$_[0]} and not defined $m_timeMeasures{$_[0]}->{lastStart};
    $m_timeMeasures{$_[0]}->{lastStart} = Time::HiRes::gettimeofday();
    return 1;
}

# Usage: stopTimer(runID)
sub stopTimer
{
    return unless scalar @_ and exists $m_timeMeasures{$_[0]} and defined $m_timeMeasures{$_[0]}->{lastStart};
    $m_timeMeasures{$_[0]}->{totalTime} += Time::HiRes::tv_interval( [$m_timeMeasures{$_[0]}->{lastStart}] );
    $m_timeMeasures{$_[0]}->{lastStart} = undef;
    return 1;
}

# Usage: getTimeMeasure(runID)
sub getTimeMeasure
{
    return unless scalar @_ and exists $m_timeMeasures{$_[0]} and not defined $m_timeMeasures{$_[0]}->{lastStart};
    return $m_timeMeasures{$_[0]}->{totalTime};
}

1;