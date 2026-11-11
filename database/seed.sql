USE aicoach;

-- 초기 문제 5개
INSERT INTO problems
(id, title, category, description, hint,
 example_input, example_output, level, published, estimated_time)
VALUES
(1, '두 수의 합', '기초 입출력',
 '한 줄에 주어진 두 정수 A와 B의 합을 출력하세요.',
 'split()과 map()을 활용해 보세요.',
 '3 5', '8', 'EASY', b'1', 5),

(2, '짝수와 홀수', '조건문',
 '정수 N을 입력받아 짝수이면 EVEN, 홀수이면 ODD를 출력하세요.',
 '나머지 연산자 %를 활용하세요.',
 '7', 'ODD', 'EASY', b'1', 5),

(3, '1부터 N까지의 합', '반복문',
 '정수 N을 입력받아 1부터 N까지 모든 정수의 합을 출력하세요.',
 '반복문 또는 등차수열의 합 공식을 활용하세요.',
 '5', '15', 'EASY', b'1', 10),

(4, '문자열 뒤집기', '문자열',
 '한 줄의 문자열을 입력받아 순서를 뒤집어 출력하세요.',
 '문자열 슬라이싱이나 반복문을 활용하세요.',
 'hello', 'olleh', 'EASY', b'1', 10),

(5, '최댓값 찾기', '배열',
 '첫 번째 줄에 정수 N이 주어집니다. 두 번째 줄에는 N개의 정수가 공백으로 구분되어 주어집니다. 그중 최댓값을 출력하세요.',
 '배열을 순회하거나 max()를 활용하세요.',
 '5\n3 9 2 7 4', '9', 'EASY', b'1', 10)
ON DUPLICATE KEY UPDATE id = id;

-- 테스트 케이스: 기존 데이터가 없는 문제에만 삽입
INSERT INTO problem_test_cases
(problem_id, test_input, expected_output)
SELECT seed.problem_id, seed.test_input, seed.expected_output
FROM (
    SELECT 1 AS problem_id, '3 5' AS test_input, '8' AS expected_output
    UNION ALL SELECT 1, '10 20', '30'
    UNION ALL SELECT 1, '-4 7', '3'
    UNION ALL SELECT 2, '7', 'ODD'
    UNION ALL SELECT 2, '8', 'EVEN'
    UNION ALL SELECT 2, '0', 'EVEN'
    UNION ALL SELECT 3, '5', '15'
    UNION ALL SELECT 3, '10', '55'
    UNION ALL SELECT 3, '1', '1'
    UNION ALL SELECT 4, 'hello', 'olleh'
    UNION ALL SELECT 4, 'python', 'nohtyp'
    UNION ALL SELECT 4, 'abc', 'cba'
    UNION ALL SELECT 5, '5\n3 9 2 7 4', '9'
    UNION ALL SELECT 5, '4\n-5 -2 -9 -1', '-1'
    UNION ALL SELECT 5, '3\n10 10 5', '10'
) AS seed
WHERE NOT EXISTS (
    SELECT 1
    FROM problem_test_cases tc
    WHERE tc.problem_id = seed.problem_id
      AND tc.test_input <=> seed.test_input
      AND tc.expected_output = seed.expected_output
);
