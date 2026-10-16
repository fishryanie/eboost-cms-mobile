import dayjs from 'dayjs';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { Colors, FontFamily, Palette } from 'themes';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { getCalendarWeeks, type DateRange } from './date-range';

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type RangeCalendarProps = {
  month: Date;
  onChangeMonth: (month: Date) => void;
  onSelectDay: (date: Date) => void;
  range: DateRange;
};

export function RangeCalendar({ month, onChangeMonth, onSelectDay, range }: RangeCalendarProps) {
  const weeks = getCalendarWeeks(month);
  const today = dayjs().startOf('day').toDate();

  return (
    <ThemedView gap={'two'}>
      <ThemedView alignItems='center' flexDirection='row' justifyContent='space-between' paddingBottom={'two'}>
        <MonthArrow direction='previous' onPress={() => onChangeMonth(dayjs(month).subtract(1, 'month').toDate())} />
        <ThemedText accessibilityRole='header' color={Palette.textPrimary} flex={1} fontFamily={FontFamily.semibold} fontSize={17} textAlign='center'>
          {dayjs(month).format('MMMM YYYY')}
        </ThemedText>
        <MonthArrow direction='next' onPress={() => onChangeMonth(dayjs(month).add(1, 'month').toDate())} />
      </ThemedView>

      <ThemedView flexDirection='row' paddingBottom={'one'}>
        {weekdays.map(day => (
          <ThemedView alignItems='center' flex={1} key={day}>
            <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={12} lineHeight={18}>
              {day}
            </ThemedText>
          </ThemedView>
        ))}
      </ThemedView>

      {weeks.map((week, weekIndex) => (
        <ThemedView flexDirection='row' key={weekIndex}>
          {week.map((date, dayIndex) => {
            const isStart = Boolean(date && range.start && dayjs(date).isSame(range.start, 'day'));
            const isEnd = Boolean(date && range.end && dayjs(date).isSame(range.end, 'day'));
            const inRange = Boolean(date && range.start && range.end && date >= range.start && date <= range.end);
            const isToday = Boolean(date && dayjs(date).isSame(today, 'day'));
            const endpoint = isStart || isEnd;

            return (
              <ThemedView flex={1} key={dayIndex}>
                {date ? (
                  <Pressable
                    accessibilityLabel={`${dayjs(date).format('dddd, D MMMM YYYY')}${isToday ? ', today' : ''}${isStart ? ', start date' : ''}${isEnd ? ', end date' : ''}`}
                    accessibilityRole='button'
                    accessibilityState={{ selected: endpoint || inRange }}
                    onPress={() => onSelectDay(date)}>
                    {({ pressed }) => (
                      <ThemedView alignItems='center' justifyContent='center' minHeight={48} opacity={pressed ? 0.65 : 1}>
                        {inRange ? (
                          <ThemedView
                            backgroundColor={Colors.light.backgroundSelected}
                            borderBottomLeftRadius={dayIndex === 0 ? 'pill' : 0}
                            borderBottomRightRadius={dayIndex === 6 ? 'pill' : 0}
                            borderTopLeftRadius={dayIndex === 0 ? 'pill' : 0}
                            borderTopRightRadius={dayIndex === 6 ? 'pill' : 0}
                            height={40}
                            left={isStart ? '50%' : -0.5}
                            position='absolute'
                            right={isEnd ? '50%' : -0.5}
                          />
                        ) : null}
                        <ThemedView
                          alignItems='center'
                          backgroundColor={endpoint ? Palette.accent : 'transparent'}
                          borderRadius={'pill'}
                          justifyContent='center'
                          square={40}>
                          <ThemedText
                            color={endpoint ? Palette.surfaceRaised : isToday ? Palette.accentPressed : Palette.textPrimary}
                            fontFamily={endpoint || isToday ? FontFamily.semibold : FontFamily.regular}
                            fontSize={15}
                            lineHeight={22}
                            maxFontSizeMultiplier={1.4}>
                            {date.getDate()}
                          </ThemedText>
                          {isToday && !endpoint ? (
                            <ThemedView backgroundColor={Palette.accent} borderRadius={'pill'} bottom={3} height={3} position='absolute' width={3} />
                          ) : null}
                        </ThemedView>
                      </ThemedView>
                    )}
                  </Pressable>
                ) : (
                  <ThemedView minHeight={48} />
                )}
              </ThemedView>
            );
          })}
        </ThemedView>
      ))}
    </ThemedView>
  );
}

function MonthArrow({ direction, onPress }: { direction: 'next' | 'previous'; onPress: () => void }) {
  const Icon = direction === 'previous' ? ChevronLeft : ChevronRight;
  return (
    <Pressable accessibilityLabel={direction === 'previous' ? 'Previous month' : 'Next month'} accessibilityRole='button' onPress={onPress}>
      {({ pressed }) => (
        <ThemedView alignItems='center' borderRadius={'pill'} justifyContent='center' opacity={pressed ? 0.5 : 1} square={44}>
          <Icon color={Palette.accent} size={22} />
        </ThemedView>
      )}
    </Pressable>
  );
}
